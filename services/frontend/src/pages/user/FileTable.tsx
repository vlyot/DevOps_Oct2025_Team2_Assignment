import type { File } from "../../types/file";

interface Props {
  files: File[];
  onDownload: (id: string) => void;
  onDelete: (id: string) => void;
}

export function FileTable({ files, onDownload, onDelete }: Props) {

    return (
        <div className="bucket-container">
        <table className="bucket-table">
            <thead>
            <tr>
                <th>Name</th>
                <th>Created</th>
                <th>Uploaded</th>
                <th className="actions-header">Actions</th>
            </tr>
            </thead>

            <tbody>
            {files.map((file) => (
                <tr key={file.id}>
                <td className="file-name">
                    <span className="file-icon">📄</span>
                    {file.file_name}
                </td>

                <td>{new Date(file.created_at).toLocaleString()}</td>
                <td>{new Date(file.uploaded_at).toLocaleString()}</td>

                <td className="actions">
                    <button
                        className="action-btn download"
                        onClick={() => onDownload(file.id)}
                    >
                        Download
                    </button>

                    <button
                        className="action-btn delete"
                        onClick={() => onDelete(file.id)}
                    >
                        Delete
                    </button>
                </td>
                </tr>
            ))}
            </tbody>
        </table>
        </div>
    );
}
