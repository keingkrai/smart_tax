'use client'

import React from 'react';
import Image from 'next/image';

function AboutPage() {
  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-16 max-w-5xl">
        {/* Hero */}
        <div className="text-center mb-16">
          <h1 className="text-5xl font-extrabold mb-4 text-blue-600">
            Smart Tax
          </h1>
          <p className="text-lg md:text-xl text-gray-600 max-w-3xl mx-auto">
            แพลตฟอร์มตรวจสอบสิทธิลดหย่อนภาษีจากเอกสารของคุณแบบตรงไปตรงมา:
            แค่อัปโหลดใบเสร็จหรือไฟล์ PDF ระบบจะอ่านข้อมูลและแจ้งผลทันทีว่า
            <span className="font-semibold text-gray-800"> “ลดหย่อนได้”</span> หรือ
            <span className="font-semibold text-gray-800"> “ไม่ได้”</span>
          </p>
        </div>

        {/* What & How */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-800">How It Works</h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-4-4V7a4 4 0 014-4h5l4 4v5a4 4 0 01-4 4H7z"></path></svg>
              </div>
              <h3 className="font-semibold text-lg mb-2">1. Upload Document</h3>
              <p className="text-gray-600">รองรับรูปถ่าย/ไฟล์ PDF ภาษาไทยจากใบเสร็จ/เอกสารที่เกี่ยวข้อง</p>
            </div>
            <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"></path></svg>
                </div>
              <h3 className="font-semibold text-lg mb-2">2. Automated Reading</h3>
              <p className="text-gray-600">อ่านวันที่ รายละเอียด และข้อมูลสำคัญจากภาพ/ไฟล์</p>
            </div>
            <div className="text-center">
                <div className="flex items-center justify-center h-16 w-16 rounded-full bg-blue-100 text-blue-600 mx-auto mb-4">
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                </div>
              <h3 className="font-semibold text-lg mb-2">3. Get Eligibility</h3>
              <p className="text-gray-600">บอกชัดๆ ทันทีว่าเอกสารนั้น “ลดหย่อนได้” หรือ “ไม่ได้”</p>
            </div>
          </div>
        </div>

        {/* Thank You / Acknowledgements */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-8 mb-16">
          <h2 className="text-3xl font-bold text-center mb-6 text-gray-800">ขอขอบคุณ</h2>
          <p className="text-lg text-gray-600 text-center max-w-3xl mx-auto">
            โปรเจ็กต์นี้เกิดขึ้นได้ด้วยคำแนะนำและการสนับสนุนจาก
          </p>
          <ul className="mt-6 space-y-3 text-center text-gray-700">
            <li>Asst. Prof. <span className="font-medium">Pratya Kuankeaw</span></li>
            <li>Asst. Prof. <span className="font-medium">Wongpanya Nuankeaw</span></li>
            <li>มหาวิทยาลัยพะเยา (University of Phayao)</li>
          </ul>
        </div>

        {/* Creator */}
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-8 text-gray-800">The Creator</h2>
          <div className="inline-block">
            <div className="bg-white rounded-full p-2 inline-block shadow-lg">
              <Image
                src="https://avatars.githubusercontent.com/u/11189732?v=4"
                alt="Keingkrai Buakeaw"
                width={128}
                height={128}
                className="rounded-full object-cover"
              />
            </div>
            <h3 className="text-2xl font-semibold mt-4">Keingkrai Buakeaw</h3>
            <p className="text-gray-500 mt-1">Student • University of Phayao</p>
            <div className="flex justify-center space-x-6 mt-4">
              <a
                href="https://github.com/keingkrai"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="text-gray-400 hover:text-gray-800 transition"
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path fillRule="evenodd" d="M12 2C6.477 2 2 6.477 2 12c0 4.418 2.865 8.168 6.839 9.49.5.092.682-.217.682-.482 0-.237-.009-.868-.014-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.031-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.378.203 2.398.1 2.65.64.7 1.03 1.595 1.03 2.688 0 3.848-2.338 4.695-4.566 4.943.359.308.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.001 10.001 0 0022 12c0-5.523-4.477-10-10-10z" clipRule="evenodd" /></svg>
              </a>
              <a
                href="https://www.linkedin.com/in/keingkrai-buakeaw-306537135/"
                target="_blank"
                rel="noopener noreferrer"
                aria-label="LinkedIn"
                className="text-gray-400 hover:text-blue-600 transition"
              >
                <svg className="w-7 h-7" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true"><path d="M19 0h-14C2.239 0 0 2.239 0 5v14c0 2.761 2.239 5 5 5h14c2.762 0 5-2.239 5-5V5c0-2.761-2.238-5-5-5zM8 19H5V8h3v11zM6.5 6.732C5.534 6.732 4.75 5.942 4.75 4.968S5.534 3.204 6.5 3.204s1.75.79 1.75 1.764-.784 1.764-1.75 1.764zM20 19h-3v-5.604c0-3.368-4-3.113-4 0V19h-3V8h3v1.765c1.396-2.586 7-2.777 7 2.476V19z"/></svg>
              </a>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default AboutPage;
