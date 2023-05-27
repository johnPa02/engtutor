import { NextApiRequest, NextApiResponse } from 'next';
import fs from "fs";
import path from "path";

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const { message} = req.body;

  try {
    const response = await fetch(
      `https://api.elevenlabs.io/v1/text-to-speech/EXAVITQu4vr4xnSDxMaL`,
      {
        method: "POST",
        headers: {
          accept: "audio/mpeg",
          "Content-Type": "application/json",
          "xi-api-key": process.env.ELEVENLABS_API_KEY || "",
        },
        body: JSON.stringify({
          text: message,
          voice_settings: {
            stability: 0,
            similarity_boost: 0,
          },
        }),
      }
    );

    if (!response.ok) {
      throw new Error("Something went wrong");
    }

    const arrayBuffer = await response.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);
    const file = Math.random().toString(36).substring(7);

    fs.writeFile(
      path.join("public", "audio", `${file}.mp3`),
      buffer,
      (error) => {
        if (error) {
          throw error;
        }
        console.log("File written successfully");
      }
    );

    res.status(200).json({ file: `${file}.mp3` });
  } catch{
    res.status(500).json("Error");
  }
}
