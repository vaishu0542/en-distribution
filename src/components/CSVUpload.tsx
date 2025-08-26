import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Upload, FileText, CheckCircle } from 'lucide-react';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

interface CSVUploadProps {
  onStatsUpdate: () => void;
}

interface CSVRow {
  FirstName: string;
  Phone: string;
  Notes: string;
}

const CSVUpload = ({ onStatsUpdate }: CSVUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [results, setResults] = useState<any>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    // Validate file type
    const allowedTypes = [
      'text/csv',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    const fileExtension = selectedFile.name.toLowerCase().split('.').pop();
    const allowedExtensions = ['csv', 'xlsx', 'xls'];

    if (!allowedTypes.includes(selectedFile.type) && !allowedExtensions.includes(fileExtension || '')) {
      toast({
        variant: "destructive",
        title: "Invalid File Type",
        description: "Please upload a CSV, XLSX, or XLS file.",
      });
      return;
    }

    setFile(selectedFile);
    setResults(null);
  };

  const parseFile = (file: File): Promise<CSVRow[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          let workbook: XLSX.WorkBook;

          if (file.name.endsWith('.csv')) {
            workbook = XLSX.read(data, { type: 'binary' });
          } else {
            workbook = XLSX.read(data, { type: 'array' });
          }

          const sheetName = workbook.SheetNames[0];
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = XLSX.utils.sheet_to_json(worksheet);

          // Validate required columns
          if (jsonData.length === 0) {
            reject(new Error('File is empty'));
            return;
          }

          const firstRow = jsonData[0] as any;
          const requiredColumns = ['FirstName', 'Phone', 'Notes'];
          const missingColumns = requiredColumns.filter(col => !(col in firstRow));

          if (missingColumns.length > 0) {
            reject(new Error(`Missing required columns: ${missingColumns.join(', ')}`));
            return;
          }

          resolve(jsonData as CSVRow[]);
        } catch (error) {
          reject(error);
        }
      };

      reader.onerror = () => reject(new Error('Failed to read file'));

      if (file.name.endsWith('.csv')) {
        reader.readAsBinaryString(file);
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const distributeToAgents = async (records: CSVRow[]) => {
    // Get available agents
    const { data: agents, error: agentsError } = await supabase
      .from('agents')
      .select('id')
      .order('created_at');

    if (agentsError) throw agentsError;
    if (!agents || agents.length === 0) {
      throw new Error('No agents available. Please add agents first.');
    }

    // Insert records into lists table
    const listsToInsert = records.map(record => ({
      first_name: record.FirstName,
      phone: record.Phone,
      notes: record.Notes,
    }));

    const { data: insertedLists, error: listsError } = await supabase
      .from('lists')
      .insert(listsToInsert)
      .select('id');

    if (listsError) throw listsError;

    // Distribute equally among agents
    const distributions = [];
    for (let i = 0; i < insertedLists.length; i++) {
      const agentIndex = i % agents.length;
      distributions.push({
        list_id: insertedLists[i].id,
        agent_id: agents[agentIndex].id,
      });
    }

    const { error: distributionsError } = await supabase
      .from('distributions')
      .insert(distributions);

    if (distributionsError) throw distributionsError;

    // Calculate distribution stats
    const distributionStats = agents.map(agent => {
      const count = distributions.filter(d => d.agent_id === agent.id).length;
      return { agentId: agent.id, count };
    });

    return { totalRecords: records.length, distributionStats };
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      // Parse file
      setProgress(25);
      const records = await parseFile(file);

      if (records.length === 0) {
        throw new Error('No valid records found in file');
      }

      // Distribute to agents
      setProgress(50);
      const results = await distributeToAgents(records);

      setProgress(100);
      setResults(results);

      toast({
        title: "Upload Successful",
        description: `${results.totalRecords} records uploaded and distributed successfully.`,
      });

      onStatsUpdate();
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Upload Failed",
        description: error.message || "Failed to upload and distribute file",
      });
    } finally {
      setUploading(false);
    }
  };

  const resetUpload = () => {
    setFile(null);
    setResults(null);
    setProgress(0);
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Upload className="h-5 w-5 mr-2" />
            Upload & Distribute CSV
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file">Select CSV, XLSX, or XLS File</Label>
            <Input
              id="file"
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={handleFileChange}
              disabled={uploading}
            />
            <p className="text-sm text-muted-foreground">
              Required columns: FirstName, Phone, Notes
            </p>
          </div>

          {file && (
            <div className="flex items-center space-x-2 p-3 bg-muted rounded-lg">
              <FileText className="h-4 w-4" />
              <span className="text-sm">{file.name}</span>
              <span className="text-sm text-muted-foreground">
                ({(file.size / 1024).toFixed(1)} KB)
              </span>
            </div>
          )}

          {uploading && (
            <div className="space-y-2">
              <Progress value={progress} />
              <p className="text-sm text-muted-foreground text-center">
                Processing file... {progress}%
              </p>
            </div>
          )}

          <div className="flex space-x-2">
            <Button
              onClick={handleUpload}
              disabled={!file || uploading}
              className="flex-1"
            >
              {uploading ? "Processing..." : "Upload & Distribute"}
            </Button>
            {file && (
              <Button variant="outline" onClick={resetUpload} disabled={uploading}>
                Reset
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {results && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-green-600">
              <CheckCircle className="h-5 w-5 mr-2" />
              Distribution Complete
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <p><strong>Total Records Processed:</strong> {results.totalRecords}</p>
              <p><strong>Distribution:</strong> Records distributed equally among {results.distributionStats.length} agents</p>
              <div className="text-sm text-muted-foreground">
                Each agent received approximately {Math.floor(results.totalRecords / results.distributionStats.length)} records
                {results.totalRecords % results.distributionStats.length > 0 && 
                  `, with ${results.totalRecords % results.distributionStats.length} extra records distributed sequentially`
                }
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default CSVUpload;