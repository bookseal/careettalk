const functions = require('firebase-functions');
const { GoogleGenerativeAI } = require('@google/generative-ai');
const MarkdownIt = require('markdown-it');
const cors = require('cors')({origin: true});
const cheerio = require('cheerio');

const API_KEY = functions.config().gemini.api_key;

console.log('Function initialization. API_KEY:', API_KEY ? 'exists' : 'missing');

exports.convertPhrases = functions.https.onRequest((req, res) => {
  console.log('Function invoked');
  
  cors(req, res, async () => {
    console.log('CORS middleware passed');
    
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
      // Send response to OPTIONS requests
      res.set('Access-Control-Allow-Methods', 'GET, POST');
      res.set('Access-Control-Allow-Headers', 'Content-Type');
      res.set('Access-Control-Max-Age', '3600');
      return res.status(204).send('');
    }

    if (req.method !== 'POST') {
      console.log('Invalid method:', req.method);
      return res.status(405).send('Method Not Allowed');
    }

    try {
      console.log('Request body:', JSON.stringify(req.body));
      
      const { inputType, sentences, context: jobContext } = req.body;
      
      console.log('Parsed request data:', { inputType, sentences, jobContext });

      console.log('Initializing GoogleGenerativeAI');
      const genAI = new GoogleGenerativeAI(API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });
      
      console.log('Preparing prompt');
      let prompt;
      if (inputType === 'english') {
        prompt = `
          Convert the following English sentences into more casual and specific phrases
          appropriate for a ${jobContext}. Use industry-specific terms and jargon where applicable.
          Then, provide a Korean translation for each in casual speech (반말).
          The Korean translation should sound natural and use terms that would be commonly used in that specific work environment.
          Return the results in a markdown table format with three columns:
          "Original", "Converted English (Specific)", and "Korean Translation (반말)".
          Sentences:
          ${sentences}
        `;
      } else {
        prompt = `
          Convert the following Korean sentences into casual and specific English phrases
          appropriate for a ${jobContext}. Use industry-specific terms and jargon where applicable.
          The English phrases should sound natural and use terms that would be commonly used in that specific work environment.
          Return the results in a markdown table format with three columns:
          "Original Korean", "Converted English (Specific)", and "Casual Korean Translation (반말)".
          Sentences:
          ${sentences}
        `;
      }
      console.log('Prompt prepared:', prompt);

      console.log('Generating content');
      const result = await model.generateContent(prompt);
      console.log('Content generated');

      const markdown = result.response.text();
      console.log('Markdown result:', markdown);

      console.log('Rendering markdown to HTML');
      const md = new MarkdownIt();
      const html = md.render(markdown);
      console.log('HTML rendered:', html);

      console.log('Parsing HTML with cheerio');
      const $ = cheerio.load(html);
      
      let outputData = [];
      console.log('Extracting table data');
      $('tr').slice(1).each((i, elem) => {
        const cells = $(elem).find('td');
        console.log(`Row ${i + 1}: Found ${cells.length} cells`);
        if (cells.length === 3) {
          outputData.push({
            englishPhrase: $(cells[1]).text(),
            koreanTranslation: $(cells[2]).text()
          });
        }
      });
      console.log('Extracted data:', JSON.stringify(outputData));

      console.log('Sending response');
      res.status(200).json(outputData);
    } catch (error) {
      console.error('Detailed error:', error);
      console.error('Error stack:', error.stack);
      res.status(500).json({ error: 'An error occurred while processing the request', details: error.message });
    }
  });
});