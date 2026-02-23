"use client";

import { CheckCircle2, Circle, Play, XCircle } from "lucide-react";
import { useState } from "react";

// Define the available test stages
type TestStatus = "IDLE" | "RUNNING" | "PASSED" | "FAILED";

interface TestStage {
  id: string;
  name: string;
  status: TestStatus;
  logs: string[];
}

export default function ElasticsearchTestSuite() {
  const [stages, setStages] = useState<TestStage[]>([
    { id: "setup", name: "1. Initialize Index", status: "IDLE", logs: [] },
    {
      id: "create",
      name: "2. Create Document (POST)",
      status: "IDLE",
      logs: [],
    },
    {
      id: "readAll",
      name: "3. Read All Documents (GET)",
      status: "IDLE",
      logs: [],
    },
    {
      id: "readOne",
      name: "4. Read Document by ID (GET)",
      status: "IDLE",
      logs: [],
    },
    {
      id: "update",
      name: "5. Update Document (PUT)",
      status: "IDLE",
      logs: [],
    },
    {
      id: "delete",
      name: "6. Delete Document (DELETE)",
      status: "IDLE",
      logs: [],
    },
    {
      id: "search",
      name: "7. Complex Search (POST)",
      status: "IDLE",
      logs: [],
    },
  ]);

  const [isRunning, setIsRunning] = useState(false);

  // Helper function to update the state of a specific test stage
  const updateStage = (id: string, updates: Partial<TestStage>) => {
    setStages((prev) =>
      prev.map((stage) => (stage.id === id ? { ...stage, ...updates } : stage)),
    );
  };

  // Helper function to append logs to a specific test stage
  const addLog = (id: string, log: string) => {
    setStages((prev) =>
      prev.map((stage) =>
        stage.id === id ? { ...stage, logs: [...stage.logs, log] } : stage,
      ),
    );
  };

  const runTests = async () => {
    setIsRunning(true);

    // Reset all stages to IDLE before starting
    setStages((prev) =>
      prev.map((stage) => ({ ...stage, status: "IDLE", logs: [] })),
    );

    let createdDocumentId: string | null = null;

    try {
      // ----------------------------------------------------------------------
      // Test 1: Setup Index
      // ----------------------------------------------------------------------
      updateStage("setup", { status: "RUNNING" });
      addLog("setup", "Sending POST request to /api/setup...");
      const setupRes = await fetch("/api/setup", { method: "POST" });
      const setupData = await setupRes.json();

      if (!setupRes.ok) throw new Error(setupData.error || "Setup failed");
      addLog("setup", `Response: ${setupData.message}`);
      updateStage("setup", { status: "PASSED" });

      // ----------------------------------------------------------------------
      // Test 2: Create Document
      // ----------------------------------------------------------------------
      updateStage("create", { status: "RUNNING" });
      const dummyTeam = {
        name: "Test Automation FC",
        sport_type: "Football",
        founded_date: "2024-01-01",
        trophies_won: 5,
        is_active: true,
        description: "A highly resilient team.",
        // We use "jumped" to test if the english analyzer stems it to "jump"
        history:
          "The players jumped over the competition during the final match.",
        // We use HTML tags to test the html_strip character filter
        stadium_info: "Located near the <b>river</b> and central park.",
      };
      addLog(
        "create",
        `Sending POST request to /api/sports with payload: ${JSON.stringify(dummyTeam)}`,
      );

      const createRes = await fetch("/api/sports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dummyTeam),
      });
      const createData = await createRes.json();

      if (!createRes.ok) throw new Error(createData.error || "Create failed");
      createdDocumentId = createData.id;
      addLog("create", `Success! Generated Document ID: ${createdDocumentId}`);
      updateStage("create", { status: "PASSED" });

      // ----------------------------------------------------------------------
      // Test 3: Read All Documents
      // ----------------------------------------------------------------------
      updateStage("readAll", { status: "RUNNING" });
      addLog("readAll", "Sending GET request to /api/sports...");

      const readAllRes = await fetch("/api/sports");
      const readAllData = await readAllRes.json();

      if (!readAllRes.ok)
        throw new Error(readAllData.error || "Read All failed");
      addLog("readAll", `Success! Retrieved ${readAllData.length} documents.`);

      // Verify our created document is in the list
      const foundInList = readAllData.some(
        (doc: any) => doc.id === createdDocumentId,
      );
      if (!foundInList)
        throw new Error("Created document was not found in the collection.");
      updateStage("readAll", { status: "PASSED" });

      // ----------------------------------------------------------------------
      // Test 4: Read Document by ID
      // ----------------------------------------------------------------------
      updateStage("readOne", { status: "RUNNING" });
      addLog(
        "readOne",
        `Sending GET request to /api/sports/${createdDocumentId}...`,
      );

      const readOneRes = await fetch(`/api/sports/${createdDocumentId}`);
      const readOneData = await readOneRes.json();

      if (!readOneRes.ok)
        throw new Error(readOneData.error || "Read One failed");
      addLog(
        "readOne",
        `Success! Retrieved document name: ${readOneData.name}`,
      );
      updateStage("readOne", { status: "PASSED" });

      // ----------------------------------------------------------------------
      // Test 5: Update Document
      // ----------------------------------------------------------------------
      updateStage("update", { status: "RUNNING" });
      const updatePayload = { trophies_won: 99 };
      addLog(
        "update",
        `Sending PUT request to /api/sports/${createdDocumentId} with payload: ${JSON.stringify(updatePayload)}`,
      );

      const updateRes = await fetch(`/api/sports/${createdDocumentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatePayload),
      });
      const updateData = await updateRes.json();

      if (!updateRes.ok) throw new Error(updateData.error || "Update failed");
      addLog("update", `Success! Response: ${updateData.message}`);
      updateStage("update", { status: "PASSED" });

      // ----------------------------------------------------------------------
      // Test 6: Complex Query Builder Search (Full-Text)
      // ----------------------------------------------------------------------
      updateStage("search", { status: "RUNNING" });

      const searchPayload = {
        // Test stemming: 'jump' should match 'jumped' via 'english' analyzer
        historyMatch: "jump",
        // Test HTML strip: 'river' should match despite being in <b> tags
        stadiumMatch: "river",
      };

      addLog(
        "search",
        `Testing Analyzers. Sending POST to /api/sports/search with: ${JSON.stringify(searchPayload)}`,
      );

      const searchRes = await fetch("/api/sports/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(searchPayload),
      });
      const searchData = await searchRes.json();

      if (!searchRes.ok)
        throw new Error(searchData.error || "Search API failed");
      if (searchData.length === 0) {
        throw new Error(
          "Analyzer Test Failed: Could not find document via stemmed word 'jump' or stripped word 'river'.",
        );
      }

      addLog(
        "search",
        `Success! Full-Text Search returned document. Score: ${searchData[0].score}`,
      );
      updateStage("search", { status: "PASSED" });

      // ----------------------------------------------------------------------
      // Test 7: Delete Document
      // ----------------------------------------------------------------------
      updateStage("delete", { status: "RUNNING" });
      addLog(
        "delete",
        `Sending DELETE request to /api/sports/${createdDocumentId}...`,
      );

      const deleteRes = await fetch(`/api/sports/${createdDocumentId}`, {
        method: "DELETE",
      });
      const deleteData = await deleteRes.json();

      if (!deleteRes.ok) throw new Error(deleteData.error || "Delete failed");
      addLog("delete", `Success! Response: ${deleteData.message}`);

      // Verify deletion
      const verifyDeleteRes = await fetch(`/api/sports/${createdDocumentId}`);
      if (verifyDeleteRes.status !== 404) {
        throw new Error("Document still exists after deletion attempt.");
      }
      addLog(
        "delete",
        "Verified: Document securely removed from Elasticsearch index.",
      );
      updateStage("delete", { status: "PASSED" });
    } catch (error: any) {
      console.error("Test Suite Error:", error);
      // Mark the currently running stage as FAILED
      setStages((prev) =>
        prev.map((stage) => {
          if (stage.status === "RUNNING") {
            return {
              ...stage,
              status: "FAILED",
              logs: [...stage.logs, `ERROR: ${error.message}`],
            };
          }
          return stage;
        }),
      );
    } finally {
      setIsRunning(false);
    }
  };

  const StatusIcon = ({ status }: { status: TestStatus }) => {
    switch (status) {
      case "PASSED":
        return <CheckCircle2 className="text-green-500" size={24} />;
      case "FAILED":
        return <XCircle className="text-red-500" size={24} />;
      case "RUNNING":
        return (
          <div className="w-6 h-6 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
        );
      default:
        return <Circle className="text-slate-300" size={24} />;
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-8 space-y-8">
      <div className="flex justify-between items-center border-b pb-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-800">
            API Integration Tests
          </h1>
          <p className="text-slate-500 mt-2">
            Automated verification suite for Elasticsearch CRUD operations.
          </p>
        </div>
        <button
          onClick={runTests}
          disabled={isRunning}
          className="bg-blue-600 text-white px-6 py-3 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 font-semibold shadow-sm transition-all"
        >
          <Play size={18} fill="currentColor" />
          {isRunning ? "Running Tests..." : "Run All Tests"}
        </button>
      </div>

      <div className="space-y-4">
        {stages.map((stage) => (
          <div
            key={stage.id}
            className={`border rounded-lg overflow-hidden transition-colors ${
              stage.status === "FAILED"
                ? "border-red-200 bg-red-50"
                : stage.status === "PASSED"
                  ? "border-green-200 bg-green-50"
                  : "border-slate-200 bg-white"
            }`}
          >
            <div className="p-4 flex items-center gap-4">
              <StatusIcon status={stage.status} />
              <h3 className="text-lg font-semibold text-slate-800">
                {stage.name}
              </h3>
            </div>

            {stage.logs.length > 0 && (
              <div className="bg-slate-900 p-4 border-t border-slate-200 text-green-400 font-mono text-sm max-h-60 overflow-y-auto">
                {stage.logs.map((log, index) => (
                  <div key={index} className="mb-1">
                    <span className="text-slate-500 mr-2">
                      [{new Date().toLocaleTimeString()}]
                    </span>
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
