'use client';

import {
    useState,
    useEffect
} from 'react';
import Image from 'next/image';

const StatusBadge = ({
    text
}) => {
    const statusTone = (txt = '') => {
        const t = String(txt);
        if (/ไม่|fail|reject/i.test(t)) return 'bad';
        if (/ผ่าน|ได้|success|ok/i.test(t)) return 'good';
        if (/ตรวจสอบ|pending|review/i.test(t)) return 'warn';
        return 'neutral';
    };

    const tone = statusTone(text);
    const cls = {
        good: 'bg-green-100 text-green-700',
        bad: 'bg-red-100 text-red-700',
        warn: 'bg-yellow-100 text-yellow-800',
        neutral: 'bg-gray-100 text-gray-700',
    } [tone];
    return <span className = {
        `inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${cls}`
    } > {
        text || '-'
    } </span>;
};


export default function RecentFiles({
    saved,
    handleDelete
}) {
    const [error, setError] = useState(null);
    const API_URL = process.env.PY_BACKEND_URL || 'https://smart-tax-backend.onrender.com';

    return (
        <div>
        <div className = "flex items-center justify-between mb-6" >
        <h2 className = "text-3xl font-bold text-gray-800" > Recent Files </h2>
        </div>

        {
            saved.length === 0 ? (
                <div className = "text-center bg-white p-12 rounded-2xl border border-gray-200" >
                <p className = "text-gray-500" > You have no saved files yet. </p>
                <p className = "text-sm text-gray-400 mt-2" > Upload a document to get started. </p>
                </div>
            ) : (
                <div className = "grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6" > {
                    saved.map((rec) => (
                        <div key = {
                            rec.id
                        }
                        className = "bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200 hover:shadow-lg transition-shadow duration-300 group" >
                        <div className = "relative w-full h-40" >
                        <Image src = {
                            `http://localhost:8000/thumb_text?text=${encodeURIComponent(rec.result_json?.title || 'Doc')}`
                        }
                        alt = {
                            rec.result_json?.title || 'Document'
                        }
                        layout = "fill"
                        objectFit = "cover" />
                        </div>
                        <div className = "p-5" >
                        <div className = "flex items-start justify-between mb-2" >
                        <h3 className = "font-semibold text-gray-800 line-clamp-2 flex-1 mr-2" > {
                            rec.result_json?.title
                        } </h3>
                        <StatusBadge text = {
                            rec.result_json?.deduction_status
                        }
                        />
                        </div>
                        <p className = "text-sm text-gray-500 mt-1" > Seller: {
                            rec.result_json?.seller
                        } </p>
                        <p className = "text-xs text-gray-400 mt-1" > Buyer: {
                            rec.buyer_name
                        } </p>
                        <p className = "text-xs text-gray-400 mt-1" > Date: {
                            rec.doc_date
                        } </p> {
                            rec.result_json?.reason && <p className = "text-xs text-red-500 mt-2 line-clamp-2" > Reason: {
                                rec.result_json?.reason
                            } </p>}

                            <div className = "mt-4 pt-4 border-t border-gray-100 flex items-center justify-end gap-4" >
                                <button className = "text-xs text-gray-500 hover:text-blue-600 transition-colors"
                                title = "Download Original"
                                onClick = {
                                    () => {
                                        if (rec.original_name) {
                                            window.location.href = `http://localhost:8000/download/${encodeURIComponent(rec.original_name)}`;
                                        } else {
                                            alert('Original file name not available.');
                                        }
                                    }
                                } >
                                Download
                                </button>
                                <button className = "text-xs text-red-500 hover:text-red-700 transition-colors"
                                title = "Delete"
                                onClick = {
                                    () => handleDelete(rec.id)
                                } >
                                Delete
                                </button>
                                </div>
                                </div>
                                </div>
                        ))
                } </div>
            )
        } {
            error && <p className = "mt-4 text-red-600 text-center" > ⚠️ {
                error
            } </p>}
            </div>
    );
}
