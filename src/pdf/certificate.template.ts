import { text, image, barcodes } from "@pdfme/schemas";
import { generate } from "@pdfme/generator";
import * as fs from "fs"
import * as path from "path";

export async function generateCertificate({name, courseName, issueDate, credentialId, clientDomain}) {

    const font = {
        
        hand_written: {
          data:  fs.readFileSync(path.join(__dirname, './assets/fonts/Parisienne-Regular.ttf')),
          fallback: true,
        },
        nato: {
          data:  fs.readFileSync(path.join(__dirname,'./assets/fonts/HindSiliguri-SemiBold.ttf')),

        },
        
      };
      const template = {
        "schemas": [
          {
            "name": {
              "type": "text",
              "position": {
                "x": 49.17,
                "y": 94.00
              },
              "width": 198.68,
              "height": 16.04,
              "fontSize": 36,
              "fontColor": "#333",
              "fontName": "hand_written",
              "alignment": "center"
            },
            "url": {
              "type": "qrcode",
              "position": {
                "x": 245.28,
                "y": 158.85
              },
              "backgroundColor": "#ffffff",
              "barColor": "#000000",
              "width": 31.32,
              "height": 32.11,
              "rotate": 0
            },
            "issueDate": {
              "type": "text",
              "position": {
                "x": 110.68,
                "y": 185.28
              },
              "width": 75.66,
              "height": 6.12,
              "fontSize": 12,
              "fontName": "nato",
              "alignment": "center"
            },
            "courseName": {
              "type": "text",
              "position": {
                "x": 43.48,
                "y": 130.0
              },
              "width": 210.07,
              "height": 11.15,
              "fontSize": 20,
              "fontName": "nato",
              "alignment": "center",
              "fontColor": "#347530"
            },
            "owner": {
              "type": "qrcode",
              "position": {
                "x": 115.09,
                "y": 225.3695712
              },
              "width": 26.53,
              "height": 26.53
            }
          }
        ],
      };
      
  const plugins = { text, image, qrcode: barcodes.qrcode };
  const inputs = [
  {
     name,
     courseName, 
    "url": `${clientDomain}/certificate/verify/${credentialId}`,
    "issueDate": `Issued at ${issueDate}`,
  }
];

    const pdf = await generate({ template, plugins, inputs, options: { font } });

  return pdf
  // Node.js
  // fs.writeFileSync(path.join(__dirname, 'test.pdf'), pdf);

  // Browser
    //   const blob = new Blob([pdf.buffer], { type: 'application/pdf' });
    //   window.open(URL.createObjectURL(blob));
}


// const plugins = { text, image, qrcode: barcodes.qrcode };
// const inputs = [
// {
//    name,
//    courseName, 
//   "photo": `https://new.upspotacademy.com/certificate/verify/${credentialId}`,
//   "issueDate": `Issued at ${issueDate}`,
// }
// ];

  