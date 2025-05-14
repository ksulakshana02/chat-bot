import {NextResponse} from 'next/server';
import * as XLSX from 'xlsx';
import OpenAI from 'openai';
import Papa from 'papaparse';

const openai = new OpenAI({
    apiKey: process.env.NEXT_PUBLIC_OPEN_AI_KEY,
});

export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const file = formData.get('file') as File | null;
        const query = formData.get('query') as string | null;

        if (!file) {
            return NextResponse.json({error: 'No file uploaded'}, {status: 400});
        }
        if (!query) {
            return NextResponse.json({error: 'No query provided'}, {status: 400});
        }

        const validTypes = [
            'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
            'application/vnd.ms-excel',
            'text/csv',
        ];
        if (!validTypes.includes(file.type)) {
            return NextResponse.json({error: 'Invalid file type. Please upload a .csv, .xlsx, or .xls file'}, {status: 400});
        }


        const buffer = Buffer.from(await file.arrayBuffer());
        let rows: { [key: string]: any }[] = [];

        const documentsData = [];

        if (file.type === 'text/csv') {
            const text = await file.text();
            const result = Papa.parse(text, {
                header: true,
                skipEmptyLines: true,
                dynamicTyping: true,
            });

            if (result.errors.length > 0) {
                return NextResponse.json({error: 'Error parsing CSV file: ' + result.errors[0].message}, {status: 400});
            }

            rows = result.data as { [key: string]: any }[];
            if (rows.length === 0) {
                return NextResponse.json({error: 'Empty CSV file'}, {status: 400});
            }
        } else {
            // const workbook = XLSX.read(buffer, {type: 'buffer'});
            // const sheetName = workbook.SheetNames[0];
            // const sheet = workbook.Sheets[sheetName];
            // const data = XLSX.utils.sheet_to_json(sheet, {header: 1}) as any[][];
            //
            // if (data.length === 0) {
            //     return NextResponse.json({error: 'Empty Excel sheet'}, {status: 400});
            // }
            //
            // const headers = data[0];
            // rows = data.slice(1).map(row => {
            //     const rowData: { [key: string]: any } = {};
            //     headers.forEach((header, index) => {
            //         rowData[header] = row[index] ?? null;
            //     });
            //     return rowData;
            // });

            const workbook = XLSX.read(buffer, {type: "buffer"});
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const json = XLSX.utils.sheet_to_json(sheet);
            documentsData.push(json);

            const cleanedData = JSON.stringify(json);
        }

        const dataString = JSON.stringify(rows, null, 2);
        const prompt =
            //         `
            //   You are a data analyst. The user has provided a file with the following data:
            //   ${dataString}
            //
            //   The user's request is: "${query}"
            //
            //   1. Identify the relevant columns based on the user's request (e.g., if the user asks for "Employee Name, Salary", match columns like "Name", "Employee Name", or "Salary").
            //   2. Extract the requested data for each row.
            //   3. Format the response as a concise summary or table, depending on the request.
            //   4. If the requested columns are not found, explain which columns are missing and suggest alternatives.
            //
            //   Example: If the user asks for "Employee Name, Salary", return a table with those columns or a message if they don't exist.
            // `
            ` You are a helpful assistant. You will receive multiple similar CONTEXTS where all fields except pricing are mostly the same. Your task:

1. Extract shared fields **once only**: referenceNumber, customerName, location, etc.
2. Extract all pricing BOQs and return them as:
   - "solutionBOQs": [ { "source": "Document 1", ...BOQ }, { "source": "Document 2", ...BOQ } ]
3. Include "optionalItems" the same way if present.
4. Other fields like termsAndConditions should be merged if similar, or shown as an array if different.

Ensure JSON is valid. Use "null" where values are missing.

**CONTEXTS:**
${JSON.stringify(documentsData)}

Response format:

{
  "referenceNumber": "<Reference Number>",
  "customerName": "<Customer Name>",
  "designation": "<Designation>",
  "companyName": "<Company Name>",
  "requirements": "<Requirements>",
  "Address": "<Address>",
  "location": "<Location>",
  "ProjectScope": [summary of project scope],
  "solutionBOQs": [
    {
      "source": "Document 1",
      "items": [ ...BOQ rows... ]
    },
    {
      "source": "Document 2",
      "items": [ ...BOQ rows... ]
    }
  ],
  "optionalItems": [...],
  "termsAndConditions": [delivery period,terms of payment,validity of the offer,waranty,presventive and corrective maintenance,maintainance window,falicily requirements,complementary services,other remarks]
}
\``
        ;

        const completion = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: [{role: 'user', content: prompt}],
            max_tokens: 500,
        });

        const openAIResponse = completion.choices[0].message.content || 'No response from Open AI';

        return NextResponse.json({data: documentsData, openAIResponse}, {status: 200});
    } catch (error) {
        console.error(error);
        return NextResponse.json({error: 'Error processing file'}, {status: 500});
    }
}