"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { parseDSCDocument, extractResourceTypes, getResourceName } from "@/lib/dsc-parser";
import {
  Upload,
  FileCode2,
  CheckCircle2,
  XCircle,
  Blocks,
  FileUp,
  Clipboard,
} from "lucide-react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ImportPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"paste" | "file">("paste");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [rawDocument, setRawDocument] = useState("");
  const [parseResult, setParseResult] = useState<{
    success: boolean;
    resourceCount?: number;
    resourceTypes?: string[];
    error?: string;
  } | null>(null);
  const [importing, setImporting] = useState(false);

  const handleValidate = () => {
    if (!rawDocument.trim()) {
      toast.error("Paste or upload a DSC configuration document first");
      return;
    }
    const result = parseDSCDocument(rawDocument);
    if (result.success && result.data) {
      setParseResult({
        success: true,
        resourceCount: result.data.resources.length,
        resourceTypes: extractResourceTypes(result.data),
      });
      toast.success(`Valid DSC document with ${result.data.resources.length} resources`);
    } else {
      setParseResult({ success: false, error: result.error });
      toast.error("Invalid DSC document");
    }
  };

  const handleImport = async () => {
    if (!name.trim()) {
      toast.error("Configuration name is required");
      return;
    }
    if (!parseResult?.success) {
      toast.error("Validate the document first");
      return;
    }

    setImporting(true);
    try {
      const res = await fetch("/api/configurations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, description, document: rawDocument }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Import failed");
      }
      toast.success("Configuration imported successfully");
      router.push("/configurations");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Import failed");
    } finally {
      setImporting(false);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const content = ev.target?.result as string;
      setRawDocument(content);
      setParseResult(null);
      if (!name) {
        setName(file.name.replace(/\.(yaml|yml|json|dsc\.config\.(yaml|yml|json))$/i, ""));
      }
    };
    reader.readAsText(file);
  };

  const sampleYaml = `$schema: https://aka.ms/dsc/schemas/v3/bundled/config/document.json
metadata:
  Microsoft.DSC:
    version: "3.0.0"
parameters:
  siteName:
    type: string
    defaultValue: Default Web Site
resources:
  - name: IIS Web Server Feature
    type: PSDscResources/WindowsFeature
    properties:
      Name: Web-Server
      Ensure: Present
  - name: TLS 1.2 Enabled
    type: Microsoft.Windows/Registry
    properties:
      keyPath: HKLM\\SYSTEM\\CurrentControlSet\\Control\\SecurityProviders\\SCHANNEL\\Protocols\\TLS 1.2\\Server
      valueName: Enabled
      valueData:
        DWord: 1
  - name: Application Running
    type: Microsoft/Process
    properties:
      name: w3wp
      _exist: true`;

  return (
    <div className="space-y-6 max-w-4xl">
      <div>
        <h2 className="text-2xl font-bold text-dsc-text">Import Configuration</h2>
        <p className="text-sm text-dsc-text-secondary mt-1">
          Import a DSC v3 configuration document (YAML or JSON) to manage its resources
        </p>
      </div>

      {/* Mode Toggle */}
      <div className="flex gap-2">
        <Button
          variant={mode === "paste" ? "primary" : "outline"}
          size="sm"
          onClick={() => setMode("paste")}
        >
          <Clipboard className="h-4 w-4" /> Paste Document
        </Button>
        <Button
          variant={mode === "file" ? "primary" : "outline"}
          size="sm"
          onClick={() => setMode("file")}
        >
          <FileUp className="h-4 w-4" /> Upload File
        </Button>
      </div>

      {/* Input Area */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <FileCode2 className="h-4 w-4 text-dsc-yellow" />
            DSC Configuration Document
          </CardTitle>
          <CardDescription>
            Supports DSC v3 configuration documents in YAML or JSON format
          </CardDescription>
        </CardHeader>
        <CardContent>
          {mode === "paste" ? (
            <div className="space-y-3">
              <Textarea
                placeholder="Paste your DSC configuration document here (YAML or JSON)..."
                className="code-editor min-h-[300px]"
                value={rawDocument}
                onChange={(e) => {
                  setRawDocument(e.target.value);
                  setParseResult(null);
                }}
              />
              <Button variant="ghost" size="sm" onClick={() => setRawDocument(sampleYaml)}>
                Load sample document
              </Button>
            </div>
          ) : (
            <div className="border-2 border-dashed border-dsc-border rounded-lg p-8 text-center">
              <Upload className="h-8 w-8 text-dsc-text-secondary mx-auto mb-3" />
              <p className="text-sm text-dsc-text-secondary mb-3">
                Drop a .yaml, .yml, or .json file here, or click to browse
              </p>
              <input
                type="file"
                accept=".yaml,.yml,.json"
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <label htmlFor="file-upload" className="cursor-pointer">
                <span className="inline-flex items-center justify-center gap-2 rounded-lg text-sm font-medium border border-dsc-border bg-white text-dsc-text hover:bg-gray-50 h-8 px-3">
                  Choose File
                </span>
              </label>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Validation Result */}
      {parseResult && (
        <Card className={parseResult.success ? "border-dsc-green/30 bg-dsc-green-50/30" : "border-dsc-red/30 bg-dsc-red-50/30"}>
          <CardContent>
            <div className="flex items-start gap-3">
              {parseResult.success ? (
                <CheckCircle2 className="h-5 w-5 text-dsc-green mt-0.5" />
              ) : (
                <XCircle className="h-5 w-5 text-dsc-red mt-0.5" />
              )}
              <div>
                {parseResult.success ? (
                  <>
                    <p className="font-medium text-dsc-text">Valid DSC Configuration Document</p>
                    <p className="text-sm text-dsc-text-secondary mt-1">
                      Found {parseResult.resourceCount} resource instance{parseResult.resourceCount !== 1 ? "s" : ""}
                    </p>
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {parseResult.resourceTypes?.map((rt) => (
                        <Badge key={rt} variant="default">
                          <Blocks className="h-3 w-3 mr-1" />
                          {getResourceName(rt)}
                        </Badge>
                      ))}
                    </div>
                  </>
                ) : (
                  <>
                    <p className="font-medium text-dsc-text">Validation Failed</p>
                    <p className="text-sm text-dsc-red mt-1">{parseResult.error}</p>
                  </>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Import Form */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Configuration Details</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Configuration Name"
              placeholder="e.g., Web Server Baseline"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <Input
              label="Description (optional)"
              placeholder="Brief description of this configuration..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
            />
          </div>
          <div className="flex gap-3 mt-6">
            <Button variant="outline" onClick={handleValidate} disabled={!rawDocument.trim()}>
              <CheckCircle2 className="h-4 w-4" /> Validate
            </Button>
            <Button
              onClick={handleImport}
              disabled={!parseResult?.success || !name.trim() || importing}
            >
              <Upload className="h-4 w-4" />
              {importing ? "Importing..." : "Import Configuration"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
