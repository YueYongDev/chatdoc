export default function isBlob(object: any): object is Blob {
  return object instanceof Blob;
}