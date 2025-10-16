const GOOGLE_VISION_API_KEY = import.meta.env.VITE_GOOGLE_VISION_API_KEY;

export const isGoogleLensConfigured = Boolean(GOOGLE_VISION_API_KEY);

async function fileToBase64(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result;
      if (typeof result === 'string') {
        const base64 = result.split(',')[1] || '';
        resolve(base64);
      } else {
        reject(new Error('Unable to convert file to base64 string.'));
      }
    };
    reader.onerror = () => reject(reader.error || new Error('Failed to read file.'));
    reader.readAsDataURL(file);
  });
}

export async function analyzeImageWithLens(file, options = {}) {
  if (!GOOGLE_VISION_API_KEY) {
    throw new Error('Google Vision API key is missing. Set VITE_GOOGLE_VISION_API_KEY.');
  }

  const {
    includeLabels = true,
    includeText = true,
    includeObjects = true,
    includeSafeSearch = true,
    languageHints,
    maxResults = 5,
  } = options;

  const features = [];
  if (includeLabels) {
    features.push({ type: 'LABEL_DETECTION', maxResults });
  }
  if (includeObjects) {
    features.push({ type: 'OBJECT_LOCALIZATION', maxResults });
  }
  if (includeText) {
    features.push({ type: 'TEXT_DETECTION', maxResults: 10 });
  }
  if (includeSafeSearch) {
    features.push({ type: 'SAFE_SEARCH_DETECTION' });
  }

  const content = await fileToBase64(file);

  const requestPayload = {
    requests: [
      {
        image: { content },
        features,
        imageContext: languageHints ? { languageHints } : undefined,
      },
    ],
  };

  const response = await fetch(`https://vision.googleapis.com/v1/images:annotate?key=${GOOGLE_VISION_API_KEY}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestPayload),
  });

  const payload = await response.json();

  if (!response.ok || payload.error) {
    const message = payload.error?.message || `Google Vision request failed with status ${response.status}`;
    throw new Error(message);
  }

  const [visionResponse] = payload.responses || [{}];

  const labels = (visionResponse.labelAnnotations || []).map((label) => ({
    description: label.description,
    score: label.score,
  }));

  const objects = (visionResponse.localizedObjectAnnotations || []).map((object) => ({
    name: object.name,
    score: object.score,
  }));

  const textBlocks = (visionResponse.textAnnotations || []).map((annotation) => ({
    description: annotation.description,
    locale: annotation.locale,
  }));

  const safeSearch = visionResponse.safeSearchAnnotation || null;

  return {
    labels,
    objects,
    textBlocks,
    safeSearch,
    raw: visionResponse,
  };
}
