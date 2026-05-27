'use client';

import {
    Document,
    Packer,
    Paragraph,
    HeadingLevel,
    TextRun,
    Table,
    TableRow,
    TableCell,
    WidthType
} from 'docx';
import {
    saveAs
} from 'file-saver';

const statusTone = (txt = '') => {
    const t = String(txt);
    if (/ไม่|fail|reject/i.test(t)) return 'bad';
    if (/ผ่าน|ได้|success|ok/i.test(t)) return 'good';
    if (/ตรวจสอบ|pending|review/i.test(t)) return 'warn';
    return 'neutral';
};

const StatusBadge = ({
    text
}) => {
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

const displayDate = (d) => {
    if (!d || typeof d !== 'object') return '-';

    const onlyNum = (v) => {
        const n = Number(String(v ?? '').replace(/[^\d]/g, ''));
        return Number.isFinite(n) && n > 0 ? n : null;
    };

    const day = onlyNum(d.day);
    const month = onlyNum(d.month);
    let year = onlyNum(d.year);

    if (!year) return '-';

    if (year < 2400) year += 543;

    if (year && month && day) {
        return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    }
    if (year && month) {
        return `${year}-${String(month).padStart(2, '0')}`;
    }
    return String(year);
};

const money = (s) => {
    if (s == null) return '-';
    const num = Number(String(s).replace(/[^\d.-]/g, ''));
    return isNaN(num) ? String(s) : num.toLocaleString(undefined, {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2
    });
};

const MetaRow = ({
    label,
    value
}) => (
    <div className = "flex justify-between items-center py-2 border-b border-gray-100" >
    <span className = "text-sm text-gray-500" > {
        label
    } </span>
    <span className = "font-medium text-sm text-right text-gray-800" > {
        value || '-'
    } </span>
    </div>
);

export default function ReceiptCard({
    pageNo,
    doc
}) {
    const {
        title,
        seller,
        buyer,
        tax_id,
        invoice_no,
        date,
        total,
        deduction_status,
        reason,
        category,
        sub_category,
        items
    } = doc || {};

    return (
        <div className = "bg-white rounded-2xl border border-gray-200 p-6 space-y-4 shadow-sm hover:shadow-lg transition-shadow duration-300" >
        <div className = "flex items-start justify-between gap-4" >
        <div >
        <h4 className = "font-bold text-xl text-gray-800" > {
            title || 'Document'
        } </h4>
        <p className = "text-sm text-gray-500" > Page {
            pageNo
        } {
            invoice_no ? ` - #${invoice_no}` : ''
        } </p>
        </div>
        <StatusBadge text = {
            deduction_status
        }
        />
        </div>

        {
            reason && (
                <div className = "p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm" >
                <div className = "font-semibold" > Reason </div>
                <div className = "mt-1 whitespace-pre-wrap" > {
                    reason
                } </div>
                </div>
            )
        }

        <div className = "space-y-1" >
        <MetaRow label = "Seller"
        value = {
            seller
        }
        />
        <MetaRow label = "Buyer"
        value = {
            buyer
        }
        />
        <MetaRow label = "Tax ID"
        value = {
            tax_id
        }
        />
        <MetaRow label = "Document Date"
        value = {
            displayDate(date)
        }
        />
        <MetaRow label = "Category"
        value = {
            category
        }
        />
        <MetaRow label = "Total Amount"
        value = {
            money(total)
        }
        />
        </div>

        {
            Array.isArray(items) && items.length > 0 && (
                <div className = "mt-4 pt-4 border-t border-gray-200" >
                <h5 className = "text-base font-semibold mb-2 text-gray-700" > Items </h5>
                <div className = "overflow-x-auto" >
                <table className = "min-w-full text-sm" >
                <thead >
                <tr className = "bg-gray-50 text-left text-gray-600" >
                <th className = "px-4 py-2 font-semibold" > Description </th>
                <th className = "px-4 py-2 font-semibold text-right" > Amount </th>
                </tr>
                </thead>
                <tbody > {
                    items.map((it, idx) => (
                        <tr key = {
                            idx
                        }
                        className = "border-b border-gray-100" >
                        <td className = "px-4 py-2" > {
                            it?.name || '-'
                        } </td>
                        <td className = "px-4 py-2 text-right" > {
                            money(it?.total_price)
                        } </td>
                        </tr>
                    ))
                }
                </tbody>
                </table>
                </div>
                </div>
            )
        }
        </div>
    );
}
