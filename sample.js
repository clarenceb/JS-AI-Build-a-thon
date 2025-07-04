import ModelClient, { isUnexpected } from "@azure-rest/ai-inference";
import { DefaultAzureCredential } from "@azure/identity";
import { AzureKeyCredential } from "@azure/core-auth";
import fs from "fs";

import "dotenv/config";

// Not used by required for the quest to pass
const pat = process.env["GITHUB_TOKEN"];

const endpoint = process.env["ENDPOINT"];
const key = process.env["KEY"];
const modelName = process.env["MODEL_NAME"];
const imageFilePath = "./contoso_layout_sketch.jpg"
const imageFormat = "jpeg";

export async function main() {
  const client = createModelClient(endpoint, key);

  const response = await client.path("/chat/completions").post({
    body: {
      messages: [
        {
          role: "system",
          content: "You are a helpful assistant that describes images in details.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: "Write HTML and CSS code for a web page based on the following hand-drawn sketch." },
            {
              type: "image_url",
              image_url: {
                url: getImageDataUrl(imageFilePath, imageFormat),
              },
            },
          ],
        },
      ],
      model: modelName,
    },
  });

  if (isUnexpected(response)) {
    throw response.body.error;
  }

  console.log(response.body.choices[0].message.content);
}

main().catch((err) => {
  console.error("The sample encountered an error:", err);
});

function createModelClient(endpoint, key) {
  // auth scope for AOAI resources is currently https://cognitiveservices.azure.com/.default
  // auth scope for MaaS and MaaP is currently https://ml.azure.com
  // (Do not use for Serverless API or Managed Computer Endpoints)
  if (key) {
    return ModelClient(endpoint, new AzureKeyCredential(key));
  } else {
    const scopes = [];
    if (endpoint.includes(".models.ai.azure.com")) {
      scopes.push("https://ml.azure.com");
    } else if (endpoint.includes(".openai.azure.com/openai/deployments/")) {
      scopes.push("https://cognitiveservices.azure.com");
    }

    const clientOptions = { credentials: { scopes } };
    return ModelClient(endpoint, new DefaultAzureCredential(), clientOptions);
  }
}

function getImageDataUrl(imageFile, imageFormatType) {
  try {
    const imageBuffer = fs.readFileSync(imageFile);
    const imageBase64 = imageBuffer.toString("base64");
    return `data:image/${imageFormatType};base64,${imageBase64}`;
  } catch (error) {
    console.error(`Could not read '${imageFile}'.`);
    console.error("Set the correct path to the image file before running this sample.");
    process.exit(1);
  }
}