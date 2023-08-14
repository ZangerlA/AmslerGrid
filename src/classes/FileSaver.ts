export class FileSaver {
    public save(blob: Blob, filename?: string): void {
        const url = URL.createObjectURL(blob);

        const link = document.createElement('a');
        link.href = url;
        link.download = filename ? filename + ".json" : "config.json";

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }
}