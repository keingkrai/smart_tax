'use client';

import React, { useState, useEffect } from 'react';
import Image from 'next/image';



const statusTone = (txt = '') => {
  const t = String(txt);
  if (/ไม่|fail|reject/i.test(t)) return 'bad';
  if (/ผ่าน|ได้|success|ok/i.test(t)) return 'good';
  if (/ตรวจสอบ|pending|review/i.test(t)) return 'warn';
  return 'neutral';
};

const StatusBadge = ({ text }) => {
  const tone = statusTone(text);
  const cls = {
    good: 'bg-green-100 text-green-700',
    bad: 'bg-red-100 text-red-700',
    warn: 'bg-yellow-100 text-yellow-800',
    neutral: 'bg-gray-100 text-gray-700',
  }[tone];
  return <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${cls}`}>{text || '-'}</span>;
};

function CollectionPage() {
  const [files, setFiles] = useState([]);
  const [filteredFiles, setFilteredFiles] = useState([]);
  const [categories, setCategories] = useState(['All']);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [selectedYear, setSelectedYear] = useState('All');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRecord, setSelectedRecord] = useState(null);

  const employee = typeof window !== 'undefined' ? localStorage.getItem('token') : null;
  const employee_id = employee ? JSON.parse(employee).id : null;


  console.log(selectedRecord)

  const fetchRecords = async () => {
    setIsLoading(true);
    if (!employee_id) {
        if (typeof window !== 'undefined') {
            window.location.href = '/login';
        }
        return;
    }
    try {
      const res = await fetch(`http://localhost:8000/api/get_all_document?employee_id=${employee_id}`,{
        method: 'GET'
      });
      if (!res.ok) {
        throw new Error("Failed to fetch records from backend");
      }
      const data = await res.json();
      if (data?.ok && Array.isArray(data.documents)) {
        const formattedFiles = data.documents.map(record => ({
          ...record,
          name: record.result_json?.title || record.original_name || `Doc ${record.id}`,
          category: record.result_json?.seller || 'Uncategorized',
          year: record.doc_date ? new Date(record.doc_date).getFullYear() : 'Uncategorized',
          imageUrl: `http://localhost:8000/thumb_text?text=${encodeURIComponent(record.result_json?.title || 'Doc')}`,
          details: record.result_json
        }));
        setFiles(formattedFiles);
        const uniqueCategories = ['All', ...new Set(formattedFiles.map(f => f.details?.category).filter(Boolean))];
        setCategories(uniqueCategories);
      } else {
        setFiles([]);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchRecords();
  }, []);

  useEffect(() => {
    const filterFiles = () => {
        const filtered = files.filter(file => {
        const categoryMatch = selectedCategory === 'All' || file.details?.category === selectedCategory;
        const yearMatch = selectedYear === 'All' || String(file.year) === selectedYear;
        return categoryMatch && yearMatch;
      });
      setFilteredFiles(filtered);
    };
    filterFiles();
  }, [files, selectedCategory, selectedYear]);


  const handleDeleteFile = (id) => {
    if (confirm('Are you sure you want to delete this document? This action only removes it from the view.')) {
        setFiles(files.filter((file) => file.id !== id));
    }
  };

  const handleShow = (record) => {
    setSelectedRecord(record);
  };

  const handleClose = () => {
    setSelectedRecord(null);
  };


  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
        <p className="text-gray-500">Loading documents...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-8 flex justify-center items-center">
        <p className="text-red-500">Error: {error}</p>
      </div>
    );
  }

  return (
      
        <div className="bg-gray-50 min-h-screen">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-12">
            <div className="mb-12">
              <h1 className="text-4xl font-bold text-gray-800 mb-4">Your Collection</h1>
              <p className="text-gray-500">Browse and manage your uploaded documents.</p>
            </div>

            <div className="flex flex-wrap items-center justify-between mb-8 gap-4">
              <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                <span className="text-sm font-medium text-gray-600">Filter by:</span>
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => setSelectedCategory(category)}
                    className={`px-4 py-2 rounded-full text-sm font-semibold transition-colors duration-200 ${selectedCategory === category ? 'bg-gray-800 text-white shadow-sm' : 'bg-white text-gray-700 hover:bg-gray-100'}`}>
                    {category}
                  </button>
                ))}
              </div>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-medium text-gray-600">Year:</span>
                <select
                  value={selectedYear}
                  onChange={e => setSelectedYear(e.target.value)}
                  className="px-3 py-2 border border-gray-200 bg-white rounded-md text-sm focus:ring-2 focus:ring-gray-800 focus:border-transparent">
                  {
                    (() => {
                      const yearOptions = ['All', ...[...new Set(files.map(f => f.year))].filter(y => y && y !== 'Uncategorized').sort((a, b) => b - a)];
                      if (files.some(f => f.year === 'Uncategorized')) {
                        yearOptions.push('Uncategorized');
                      }
                      return yearOptions.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ));
                    })()
                  }
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-8">
              {filteredFiles.map(file => (
                <div key={file.id} className="bg-white rounded-xl overflow-hidden transition-shadow duration-300 hover:shadow-lg group">
                  <div className="relative w-full h-48">
                    <Image
                      src={file.imageUrl}
                      alt={file.name}
                      layout="fill"
                      objectFit="cover"
                      className="transition-transform duration-300 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                      <h3 className="font-semibold text-gray-800 line-clamp-2 flex-1 mr-2">{file.name}</h3>
                      <StatusBadge text={file.result_json?.deduction_status} />
                    </div>
                    <p className="text-sm text-gray-500 mt-1">Seller: {file.result_json?.seller}</p>
                    <p className="text-xs text-gray-400 mt-1">Buyer: {file.buyer_name}</p>
                    <p className="text-xs text-gray-400 mt-1">Date: {file.doc_date}</p>
                    {file.result_json?.reason && <p className="text-xs text-red-500 mt-2 line-clamp-2">Reason: {file.result_json?.reason}</p>}

                    <div className="mt-4 pt-4 border-t border-gray-100 flex items-center justify-end gap-2">
                      <button
                        className="text-xs text-gray-500 hover:text-green-600 transition-colors"
                        title="Download Original"
                        onClick={() => {
                          if (file.original_name) {
                            window.location.href = `http://localhost:8000/download/${encodeURIComponent(file.original_name)}`;
                          } else {
                            alert('Original file name not available.');
                          }
                        }}
                      >
                        Download
                      </button>
                      <button
                        className="text-xs text-gray-500 hover:text-blue-600 transition-colors"
                        title="Show Details"
                        onClick={() => handleShow(file.details)}
                      >
                        Details
                      </button>
                      <button
                        className="text-xs text-gray-500 hover:text-red-600 transition-colors"
                        title="Delete"
                        onClick={() => handleDeleteFile(file.id)}
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            {filteredFiles.length === 0 && (
                <div className="text-center text-gray-500 py-20">
                    <p className="text-lg">No documents found.</p>
                    <p className="text-sm">Try adjusting your filters or uploading new documents.</p>
                </div>
            )}
          </div>

          {selectedRecord && (
            <div className="fixed inset-0 bg-black bg-opacity-60 flex justify-center items-center p-4 z-50 transition-opacity duration-300">
              <div className="bg-white rounded-lg shadow-2xl p-8 max-w-3xl w-full max-h-[90vh] overflow-y-auto transform transition-transform duration-300 scale-95 group-hover:scale-100">
                <div className="flex justify-between items-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-800">Record Details</h2>
                  <button
                    onClick={handleClose}
                    className="text-gray-400 hover:text-gray-800 text-4xl transition-colors"
                  >
                    &times;
                  </button>
                </div>
                <h3 className="font-bold text-lg text-gray-700">
                  {selectedRecord.receipt_info?.seller_name}
                </h3>
                <p className="text-sm text-gray-500 mb-4">
                  Date: {selectedRecord.receipt_info?.date}
                </p>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-600">
                      <thead className="text-xs text-gray-700 uppercase bg-gray-100 rounded-t-lg">
                        <tr>
                          <th scope="col" className="px-6 py-4 font-semibold">
                            Description
                          </th>
                          <th scope="col" className="px-6 py-4 font-semibold">
                            Amount
                          </th>
                          <th scope="col" className="px-6 py-4 font-semibold">
                            Price
                          </th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedRecord.items?.map((item, index) => (
                          <tr key={index} className="bg-white border-b border-gray-100 hover:bg-gray-50">
                            <td className="px-6 py-4">{item.name}</td>
                            <td className="px-6 py-4">{item.unit_price}</td>
                            <td className="px-6 py-4">{item.total_price}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                </div>
                <div className="mt-6 text-right">
                  <p className="text-xl font-bold text-gray-800">
                    Total: {selectedRecord.total}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      
  );
}

export default CollectionPage;
