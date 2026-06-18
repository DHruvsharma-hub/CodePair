import { NextResponse } from "next/server";

const LANGUAGE_IDS: Record<string, number> = {
  "C++": 105, // C++ (GCC 13.2.0)
  "Python": 100, // Python (3.11.2)
  "Java": 91, // Java (OpenJDK 17.0.6)
  "JavaScript": 93, // JavaScript (Node.js 18.15.0)
  "TypeScript": 94, // TypeScript (5.0.3)
};

export async function POST(request: Request) {
  try {
    const { sourceCode, language, stdin } = await request.json();

    if (!sourceCode || !language) {
      return NextResponse.json(
        { error: "Source code and language are required" },
        { status: 400 }
      );
    }

    const languageId = LANGUAGE_IDS[language] || 93; // default JS

    const apiUrl = process.env.JUDGE0_API_URL;
    const apiKey = process.env.JUDGE0_API_KEY; // RapidAPI Key or Judge0 key

    // If Judge0 is not configured, fall back to a rich mock executor for developer convenience
    if (!apiUrl) {
      console.log("JUDGE0_API_URL not configured. Running code in Mock Executor mode...");
      
      // Simulate network latency
      await new Promise((resolve) => setTimeout(resolve, 1200));

      const isCpp = language === "C++";
      const isJava = language === "Java";

      // Basic syntax check for mockup errors
      if (isCpp && !sourceCode.includes(";")) {
        return NextResponse.json({
          status: { id: 6, description: "Compilation Error" },
          compile_output: "error: expected ';' before token in code",
          stdout: null,
          stderr: null,
          time: "0.01",
          memory: 120
        });
      }

      // Simple regex evaluator to match prints
      let mockStdout = "";
      
      // Look for console.log("...")
      const jsLogRegex = /console\.log\((['"`])(.*?)\1\)/g;
      let match;
      while ((match = jsLogRegex.exec(sourceCode)) !== null) {
        mockStdout += match[2] + "\n";
      }

      // Look for print("...") or print('...')
      const pyPrintRegex = /print\((['"`])(.*?)\1\)/g;
      while ((match = pyPrintRegex.exec(sourceCode)) !== null) {
        mockStdout += match[2] + "\n";
      }

      // Look for System.out.println("...")
      const javaPrintRegex = /System\.out\.println\((['"`])(.*?)\1\)/g;
      while ((match = javaPrintRegex.exec(sourceCode)) !== null) {
        mockStdout += match[2] + "\n";
      }

      // Look for cout << "..."
      const cppCoutRegex = /cout\s*<<\s*(['"`])(.*?)\1/g;
      while ((match = cppCoutRegex.exec(sourceCode)) !== null) {
        mockStdout += match[2] + "\n";
      }

      // Default message if no prints were matched
      if (!mockStdout) {
        mockStdout = `[Mock Code Execution Success]\nLanguage: ${language}\nSource length: ${sourceCode.length} chars\nCustom Stdin: ${stdin || "None"}`;
      }

      return NextResponse.json({
        status: { id: 3, description: "Accepted" },
        stdout: mockStdout,
        stderr: null,
        compile_output: null,
        time: "0.05",
        memory: 2400
      });
    }

    // Call Real Judge0 API
    const isRapidApi = apiUrl.includes("rapidapi.com");
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };

    if (isRapidApi && apiKey) {
      headers["X-RapidAPI-Key"] = apiKey;
      headers["X-RapidAPI-Host"] = new URL(apiUrl).hostname;
    } else if (apiKey) {
      headers["Authorization"] = `Bearer ${apiKey}`;
    }

    const response = await fetch(`${apiUrl}/submissions?base64_encoded=false&wait=true`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        source_code: sourceCode,
        language_id: languageId,
        stdin: stdin || "",
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: `Judge0 execution failed: ${errorText}` },
        { status: response.status }
      );
    }

    const result = await response.json();
    return NextResponse.json({
      status: result.status,
      stdout: result.stdout,
      stderr: result.stderr,
      compile_output: result.compile_output,
      time: result.time,
      memory: result.memory,
    });

  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Compilation failed" },
      { status: 500 }
    );
  }
}
