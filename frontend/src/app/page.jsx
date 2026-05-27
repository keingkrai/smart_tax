'use client';

import {
    useState,
    useEffect
} from 'react';
import FileUpload from './components/home/FileUpload';
import ReceiptCard from './components/home/ReceiptCard';
import RecentFiles from './components/home/RecentFiles';

// Helper to normalize pages from the result
const normalizePages = (result) => {
    if (!result) return [];
    if (result.pages && typeof result.pages === 'object') {
        return Object.entries(result.pages)
            .sort(([a], [b]) => Number(a) - Number(b))
            .map(([page, doc]) => ({
                page,
                doc
            }));
    }
    return [{
        page: 1,
        doc: result
    }];
};

export default function Home() {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [uploading, setUploading] = useState(false);
    const [result, setResult] = useState(null);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [saved, setSaved] = useState([]);

    const [employee_id, setEmployeeId] = useState(null);

    // Effect for authentication and redirect
    useEffect(() => {
        const employeeData = localStorage.getItem('token');
        if (employeeData) {
            setEmployeeId(JSON.parse(employeeData).id);
        } else {
            // Redirect to login if no token found
            window.location.href = '/login';
        }
    }, []); // Empty dependency array means this runs once on the client side

    const fetchDocuments = async () => {
        if (!employee_id) return; // Guard against running before employee_id is set
        try {
            const res = await fetch(`http://localhost:8000/api/get_all_document?employee_id=${employee_id}`);
            const data = await res.json();
            if (data?.ok && Array.isArray(data.documents)) {
                setSaved(data.documents);
            } else {
                setSaved([]);
            }
        } catch {
            setSaved([]);
        }
    };

    // Effect for fetching documents, runs when employee_id changes
    useEffect(() => {
        if (employee_id) { // Only fetch if employee_id is available
            fetchDocuments();
        }
    }, [employee_id]);

    const onFileSelected = (f) => {
        setFile(f);
        setResult(null);
        setError(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        if (f && f.type?.startsWith('image/')) {
            setPreviewUrl(URL.createObjectURL(f));
        } else {
            setPreviewUrl(null);
        }
    };

    const handleProcess = async () => {
        if (!file) {
            setError('Please select a file to process.');
            return;
        }
        setUploading(true);
        setError(null);
        setResult(null);
        try {
            const fd = new FormData();
            fd.append('file', file);
            
            const res = await fetch(`http://localhost:8000/api/process`, {
                method: 'POST',
                body: fd
            });
            const data = await res.json();
            if (!res.ok || !data?.ok) throw new Error(data?.error || data?.detail || 'Upload failed');
            setResult(data.result || data);
            setSuccess('Document processed successfully!');
        } catch (err) {
            setError(err?.message || 'An error occurred during processing.');
        } finally {
            setUploading(false);
        }
    };

    const handleSave = async () => {
        if (!result) {
            setError('No result to save.');
            return;
        }

        const pages = normalizePages(result);
        const first = pages[0]?.doc || {};

        const meta = {
            original_name: result.file || file?.name || 'document',
            file_path: `/uploads/${result.file || file?.name || 'document'}`,
            mime_type: file?.type || 'application/pdf',
            file_size_bytes: file?.size || 0,
            sha256: 'abc123...' // Placeholder
        };

        const result_json = first;

        try {
            const res = await fetch(
                `http://localhost:8000/api/insert_document?employee_id=${employee_id}&member_name=default`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        meta,
                        result_json
                    }),
                }
            );
            const data = await res.json();
            if (!res.ok || !data?.ok) throw new Error(data?.error || 'Save failed');

            setSuccess('✅ Successfully saved!');
            setError(null);
            fetchDocuments(); // Refetch documents after successful save
        } catch (e) {
            setError(e?.message || 'Failed to save.');
            setSuccess(null);
        }
    };

    const handleDelete = async (docId) => {
        if (!confirm('Are you sure you want to delete this document?')) return;

        try {
            const res = await fetch(`http://localhost:8000/api/delete_document?document_id=${docId}`, {
                method: 'DELETE',
            });
            const data = await res.json();
            if (!res.ok || !data?.ok) {
                throw new Error(data?.error || 'Delete failed');
            }
            fetchDocuments(); // Refresh the list
        } catch (e) {
            setError(e?.message || 'Failed to delete document');
        }
    };


    return (
        <main className = "bg-gray-50 min-h-screen" >
        <div className = "container mx-auto px-4 sm:px-6 lg:px-8 py-12" >
        <FileUpload onFileSelect = {
            onFileSelected
        }
        onProcess = {
            handleProcess
        }
        uploading = {
            uploading
        }
        file = {
            file
        }
        previewUrl = {
            previewUrl
        }
        />

        {
            error && <p className = "my-4 text-center text-red-600 bg-red-100 p-3 rounded-lg" > ⚠️ {
                error
            } </p>} {
            success && <p className = "my-4 text-center text-green-600 bg-green-100 p-3 rounded-lg" > {
                success
            } </p>}

            {
                result && (
                    <div className = "mt-8" >
                    <div className = "flex justify-between items-center mb-6" >
                    <h2 className = "text-3xl font-bold text-gray-800" > Processing Result </h2>
                    <button onClick = {
                        handleSave
                    }
                    className = "px-6 py-3 bg-green-600 text-white font-semibold rounded-lg shadow-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 disabled:opacity-50 transition-all" >
                    Save Result
                    </button>
                    </div>
                    <div className = "space-y-6" > {
                        normalizePages(result).map(({
                            page,
                            doc
                        }) => (
                            <ReceiptCard key = {
                                page
                            }
                            pageNo = {
                                page
                            }
                            doc = {
                                doc
                            }
                            />
                        ))
                    } </div>

                    {/* <details className = "mt-6" >
                    <summary className = "cursor-pointer text-sm text-gray-600 hover:text-gray-800" >
                    View Full JSON (for debugging)
                    </summary>
                    <pre className = "bg-gray-100 p-4 rounded-lg text-xs overflow-auto mt-2" > {
                        JSON.stringify(result, null, 2)
                    }
                    </pre>
                    </details> */}
                    </div>
                )
            }

            <div className = "mt-12" >
            <RecentFiles saved = {saved}
            handleDelete = {handleDelete}
            />
            </div>
            </div>
            </main>
        );
    }
