const fs = require('fs')
const path = require('path')
const os = require('os')

async function testPdfExtract() {
  try {
    console.log('Testing pdf-extract library...')
    
    // Create a simple test PDF file
    const testPdfPath = path.join(os.tmpdir(), 'test.pdf')
    console.log('Creating test PDF at:', testPdfPath)
    
    // Write a simple PDF file (this is a minimal valid PDF)
    const pdfContent = `%PDF-1.4
1 0 obj
<<
/Type /Catalog
/Pages 2 0 R
>>
endobj
2 0 obj
<<
/Type /Pages
/Kids [3 0 R]
/Count 1
>>
endobj
3 0 obj
<<
/Type /Page
/Parent 2 0 R
/MediaBox [0 0 612 792]
/Contents 4 0 R
/Resources <<
/Font <<
/F1 5 0 R
>>
>>
>>
endobj
4 0 obj
<<
/Length 44
>>
stream
BT
/F1 12 Tf
72 720 Td
(Hello World) Tj
ET
endstream
endobj
5 0 obj
<<
/Type /Font
/Subtype /Type1
/BaseFont /Helvetica
>>
endobj
xref
0 6
0000000000 65535 f 
0000000010 00000 n 
0000000053 00000 n 
0000000163 00000 n 
0000000340 00000 n 
0000000430 00000 n 
trailer
<<
/Size 6
/Root 1 0 R
>>
startxref
538
%%EOF`
    
    fs.writeFileSync(testPdfPath, pdfContent)
    console.log('Test PDF created successfully')
    
    // Try to import pdf-extract
    console.log('Importing pdf-extract...')
    const pdfExtract = (await import('pdf-extract')).default
    console.log('pdf-extract imported successfully')
    
    // Try to extract text from the PDF with the correct options
    console.log('Extracting text from PDF...')
    const extracted = await new Promise((resolve, reject) => {
      pdfExtract(testPdfPath, { type: "text" }, (err, data) => {
        if (err) {
          console.error('PDF extraction error:', err)
          reject(err)
        } else {
          console.log('PDF extraction successful')
          resolve(data)
        }
      })
    })
    
    console.log('Extracted text:', extracted.text)
    console.log('PDF extract test passed')
    
    // Clean up
    fs.unlinkSync(testPdfPath)
    console.log('Test PDF cleaned up')
    
    return true
  } catch (error) {
    console.error('Error testing pdf-extract:', error)
    return false
  }
}

testPdfExtract().then(success => {
  if (success) {
    console.log('PDF extract test passed')
  } else {
    console.log('PDF extract test failed')
  }
})