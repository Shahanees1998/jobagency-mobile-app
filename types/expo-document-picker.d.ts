declare module 'expo-document-picker' {
    export interface DocumentPickerOptions {
        type?: string | string[];
        copyToCacheDirectory?: boolean;
        multiple?: boolean;
    }

    export interface DocumentPickerAsset {
        uri: string;
        name: string;
        mimeType?: string;
        size?: number;
        lastModified?: number;
        file?: File;
    }

    export interface DocumentPickerResult {
        canceled: boolean;
        assets: DocumentPickerAsset[] | null;
    }

    export function getDocumentAsync(options?: DocumentPickerOptions): Promise<DocumentPickerResult>;
}
