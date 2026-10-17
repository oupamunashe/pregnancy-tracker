/** Downscales an image file to max 1000px JPEG so photos stay small (fast upload, small storage). */
export function shrinkImage(file: File, max = 1000): Promise<Blob & { name: string }> {
  return new Promise((resolve, reject) => {
    const img = new Image(), url = URL.createObjectURL(file);
    img.onload = () => {
      const k = Math.min(1, max / Math.max(img.width, img.height)), c = document.createElement('canvas');
      c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
      c.getContext('2d')!.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url);
      c.toBlob(b => (b ? resolve(Object.assign(b, { name: 'photo.jpg' })) : reject(new Error('Could not process that image'))), 'image/jpeg', 0.78);
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('That file isn’t a readable image')); };
    img.src = url;
  });
}
