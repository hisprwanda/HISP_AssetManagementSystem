import { useState, useMemo, useEffect } from 'react';
import {
  X,
  ShoppingCart,
  Building2,
  Calendar,
  CreditCard,
  Truck,
  Plus,
  Calculator,
  Printer,
  ShieldAlert,
  Clock,
  Briefcase,
  PenTool,
  FileText,
  Send,
  LucideIcon,
} from 'lucide-react';
import { AssetRequest, POData } from '../types/assets';

interface PurchaseOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  request: AssetRequest | null;
  onConfirm: (poData: POData) => void;
  isPending?: boolean;
}

export const PurchaseOrderModal = ({
  isOpen,
  onClose,
  request,
  onConfirm,
  isPending,
}: PurchaseOrderModalProps) => {
  const [vendorDetails, setVendorDetails] = useState('');
  const [poNumber, setPoNumber] = useState('');
  const [orderDate, setOrderDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [paymentTerms, setPaymentTerms] = useState('');
  const [specialInstructions, setSpecialInstructions] = useState('');
  const [periodOfPerformance, setPeriodOfPerformance] = useState('');

  const [shippingCost, setShippingCost] = useState<number>(0);
  const [otherCost, setOtherCost] = useState<number>(0);
  const [hispSignName, setHispSignName] = useState('');
  const [hispSignDate, setHispSignDate] = useState(
    new Date().toISOString().split('T')[0],
  );
  const [vendorSignName, setVendorSignName] = useState('');
  const [vendorSignDate, setVendorSignDate] = useState('');
  const [billTo, setBillTo] = useState('HISP Rwanda Ltd\nTIN: 103036818');
  const [shipTo, setShipTo] = useState(
    'HISP Rwanda LTD\nKimihurura/Rugando/KG 6 Avenue/ Plot 49\n0784506828 / 0788620185',
  );
  const [isDigitallySigned, setIsDigitallySigned] = useState(false);
  const [signingMethod, setSigningMethod] = useState<'digital' | 'physical'>(
    'digital',
  );
  const [scannedPoUrl, setScannedPoUrl] = useState('');

  useEffect(() => {
    if (isOpen && request) {
      if (request.purchase_order) {
        const po = request.purchase_order;
        setVendorDetails(po.vendor_details);
        setPoNumber(po.po_number);
        setOrderDate(po.order_date);
        setPaymentTerms(po.payment_terms);
        setSpecialInstructions(po.special_instructions);
        setPeriodOfPerformance(po.period_of_performance);
        setShippingCost(po.shipping_cost);
        setOtherCost(po.other_cost);
        setHispSignName(po.hisp_sign_name);
        setHispSignDate(po.hisp_sign_date);
        setVendorSignName(po.vendor_sign_name);
        setVendorSignDate(po.vendor_sign_date);
        if (po.bill_to) setBillTo(po.bill_to);
        if (po.ship_to) setShipTo(po.ship_to);
        setIsDigitallySigned(!!po.is_digitally_signed);
        setScannedPoUrl(po.scanned_po_url || '');
      } else {
        setPoNumber(
          `PO-${request.id.slice(0, 4).toUpperCase()}-${new Date().getFullYear()}`,
        );
      }

      if (request.purchase_order) {
        setSigningMethod(
          request.purchase_order.is_digitally_signed ? 'digital' : 'physical',
        );
      }
    }
  }, [isOpen, request]);

  const items = useMemo(() => request?.items || [], [request]);
  const subtotal = useMemo(() => {
    return items.reduce(
      (sum, item) => sum + item.quantity * item.unit_price,
      0,
    );
  }, [items]);

  const grandTotal = subtotal + shippingCost + otherCost;

  if (!isOpen || !request) return null;

  const handlePrint = () => {
    const printWindow = window.open('', '_blank', 'width=900,height=1100');
    if (!printWindow) return;

    const itemsHtml = items
      .map(
        (item) => `
      <tr>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:center;font-weight:700">${item.quantity}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;font-weight:700">${item.name}${item.description ? `<br/><span style="font-size:10px;color:#94a3b8;font-weight:400">${item.description}</span>` : ''}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:600">${item.unit_price.toLocaleString()}</td>
        <td style="padding:8px 12px;border-bottom:1px solid #e2e8f0;text-align:right;font-weight:800">${(item.quantity * item.unit_price).toLocaleString()}</td>
      </tr>`,
      )
      .join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Purchase Order - ${poNumber}</title>
        <style>
          * { box-sizing: border-box; margin: 0; padding: 0; }
          body { font-family: Arial, sans-serif; color: #1e293b; padding: 40px; font-size: 12px; }
          h1 { text-align: center; font-size: 24px; font-weight: 900; letter-spacing: 4px; text-transform: uppercase; margin-bottom: 4px; }
          .subtitle { text-align: center; font-size: 9px; color: #ff8000; font-weight: 700; letter-spacing: 6px; text-transform: uppercase; margin-bottom: 30px; }
          .section-header { background: #fff7ed; color: #ff8000; font-size: 9px; font-weight: 900; letter-spacing: 3px; text-transform: uppercase; padding: 6px 12px; border: 1px solid #ffedd5; }
          .grid-2 { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .grid-3 { display: grid; grid-template-columns: 1fr 1fr 1fr; gap: 20px; margin-bottom: 20px; }
          .box { border: 1px solid #e2e8f0; border-radius: 8px; padding: 12px 16px; }
          .label { font-size: 9px; color: #94a3b8; font-weight: 700; text-transform: uppercase; letter-spacing: 2px; margin-bottom: 4px; }
          .value { font-size: 12px; font-weight: 700; color: #1e293b; }
          table { width: 100%; border-collapse: collapse; margin-bottom: 0; }
          thead { background: #f1f5f9; }
          th { padding: 10px 12px; text-align: left; font-size: 9px; font-weight: 900; text-transform: uppercase; letter-spacing: 2px; color: #64748b; }
          th:last-child, td:last-child { text-align: right; }
          th:first-child, td:first-child { text-align: center; }
          .total-row { background: #ff8000; color: white; font-weight: 900; }
          .total-row td { padding: 14px 12px; font-size: 14px; }
          .sign-line { border-bottom: 1px solid #cbd5e1; height: 36px; margin-top: 8px; }
          .footer { margin-top: 30px; background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 8px; padding: 16px; font-size: 9px; color: #64748b; text-align: center; line-height: 1.6; }
          .footer strong { color: #ff8000; }
        </style>
      </head>
      <body>
        <h1>Purchase Order</h1>
        <p class="subtitle">HISP Rwanda Organization</p>

        <div class="grid-2">
          <div>
            <div class="section-header">Issued To (Vendor)</div>
            <div class="box" style="min-height:90px">
              <div class="value" style="white-space:pre-wrap">${vendorDetails || '—'}</div>
            </div>
          </div>
          <div class="box" style="display:flex;flex-direction:column;gap:10px">
            <div><div class="label">Order Date</div><div class="value">${orderDate}</div></div>
            <div><div class="label">Purchase Order #</div><div class="value">${poNumber}</div></div>
            <div><div class="label">Payment Terms</div><div class="value">${paymentTerms || '—'}</div></div>
          </div>
        </div>

        <div class="grid-3" style="margin-bottom:24px">
          <div>
            <div class="section-header">Special Instructions</div>
            <div class="box" style="min-height:70px"><div class="value">${specialInstructions || '—'}</div></div>
          </div>
          <div>
            <div class="section-header">Bill To</div>
            <div class="box" style="min-height:70px">
              <div class="value" style="white-space:pre-wrap">${billTo || '—'}</div>
            </div>
          </div>
          <div>
            <div class="section-header">Ship To / Deliver To</div>
            <div class="box" style="min-height:70px">
              <div class="value" style="white-space:pre-wrap">${shipTo || '—'}</div>
            </div>
          </div>
        </div>

        <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden;margin-bottom:20px">
          <table>
            <thead><tr><th>Qty</th><th>Item Name / Service</th><th style="text-align:right">Unit Price</th><th style="text-align:right">Total</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>
          <div style="background:#f8fafc;padding:12px 16px;display:flex;justify-content:space-between;align-items:center;border-top:1px solid #e2e8f0">
            <span style="font-size:9px;font-weight:900;text-transform:uppercase;letter-spacing:2px;color:#94a3b8">Total Approved Value</span>
            <span style="font-size:16px;font-weight:900">${subtotal.toLocaleString()} RWF</span>
          </div>
        </div>

        <div class="grid-2" style="margin-bottom:20px">
          <div>
            <div class="section-header">Period of Performance</div>
            <div class="box"><div class="value">${periodOfPerformance || '—'}</div></div>
          </div>
          <div style="border:1px solid #e2e8f0;border-radius:8px;overflow:hidden">
            <div style="padding:8px 12px;display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0">
              <span class="label" style="margin:0">Shipping</span><span style="font-weight:700">${shippingCost.toLocaleString()} RWF</span>
            </div>
            <div style="padding:8px 12px;display:flex;justify-content:space-between;border-bottom:1px solid #e2e8f0">
              <span class="label" style="margin:0">Other</span><span style="font-weight:700">${otherCost.toLocaleString()} RWF</span>
            </div>
            <div style="padding:12px;display:flex;justify-content:space-between;align-items:center;background:#ff8000">
              <span style="font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:3px;color:white">TOTAL</span>
              <span style="font-size:18px;font-weight:900;color:white">${grandTotal.toLocaleString()} RWF</span>
            </div>
          </div>
        </div>

        <div class="grid-2">
          <div>
            <div class="section-header">For HISP — Authorized Signatory</div>
            <div class="box">
              <div class="label">Name &amp; Title</div><div class="value">${hispSignName || '—'}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
                <div><div class="label">Signature</div><div class="sign-line" style="font-family:'Dancing Script', cursive;font-size:24px;text-align:center;border:none;display:flex;align-items:center;justify-content:center">${hispSignName}</div></div>
                <div><div class="label">Date</div><div class="value" style="margin-top:8px">${hispSignDate}</div></div>
              </div>
            </div>
          </div>
          <div>
            <div class="section-header">For Vendor — Acceptance</div>
            <div class="box">
              <div class="label">Name &amp; Title</div><div class="value">${vendorSignName || '—'}</div>
              <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;margin-top:16px">
                <div>
                  <div class="label">Signature</div>
                  <div class="sign-line" style="${isDigitallySigned ? "font-family:'Dancing Script', cursive;font-size:24px;text-align:center;border:none;display:flex;align-items:center;justify-content:center" : ''}">
                    ${isDigitallySigned ? vendorSignName : ''}
                  </div>
                </div>
                <div><div class="label">Date</div><div class="value" style="margin-top:8px">${vendorSignDate || '—'}</div></div>
              </div>
            </div>
          </div>
        </div>

        ${
          isDigitallySigned
            ? `
        <div style="margin-top:20px;padding:12px;background:#f0fdf4;border:1px solid #dcfce7;border-radius:8px;text-align:center">
          <span style="color:#166534;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px">✓ Digitally Signed & Accepted via HISP AMS</span>
        </div>`
            : ''
        }

        ${
          scannedPoUrl
            ? `
        <div style="margin-top:10px;padding:12px;background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;text-align:center">
          <span style="color:#64748b;font-size:10px;font-weight:900;text-transform:uppercase;letter-spacing:2px">Permanent Scanned Record Attached to System</span>
        </div>`
            : ''
        }

        <div class="footer">
          <p>Financial commitment is only established upon mutual signature of this Purchase Order by both HISP and the vendor.</p>
          <p style="margin-top:8px"><strong>HISP ANTI-BRIBERY ZERO TOLERANCE:</strong> Staff are strictly prohibited from receiving any form of motivation or gifts from vendors. Report violations to @hisprwanda.org</p>
        </div>

        <script>window.onload = function() { window.print(); };</script>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  const RequisitionLabel = ({
    label,
    icon: Icon,
  }: {
    label: string;
    icon?: LucideIcon;
  }) => (
    <label className="text-[10px] font-semibold uppercase tracking-widest text-slate-400 flex items-center gap-1.5 mb-2 group-focus-within:text-[#ff8000] transition-colors">
      {Icon && <Icon className="w-3.5 h-3.5" />}
      {label}
    </label>
  );

  return (
    <>
      <div
        className="fixed inset-0 bg-orange-950/10 backdrop-blur-sm z-40 transition-opacity"
        onClick={onClose}
      />
      <div className="fixed inset-y-0 right-0 w-full max-w-5xl bg-white shadow-2xl z-[70] animate-in slide-in-from-right duration-300 flex flex-col border-l border-slate-100">
        <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100 bg-slate-50/80 shrink-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-800 tracking-tight flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-[#ff8000]" />
              Official Purchase Order Form
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
                Drafting Final Procurement Instrument
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handlePrint}
              className="p-2.5 text-slate-400 hover:text-[#ff8000] hover:bg-orange-50 rounded-full transition-all"
              title="Print Purchase Order"
            >
              <Printer className="w-5 h-5" />
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
        <form
          className="flex-1 overflow-y-auto p-8 space-y-10 bg-white"
          onSubmit={(e) => e.preventDefault()}
        >
          <div className="bg-slate-50/30 p-8 rounded-[2rem] border border-slate-100 space-y-8">
            <div className="grid grid-cols-12 gap-10">
              <div className="col-span-12 md:col-span-7 space-y-1.5">
                <RequisitionLabel
                  label="Issued To (Vendor) *"
                  icon={Building2}
                />
                <textarea
                  required
                  value={vendorDetails}
                  onChange={(e) => setVendorDetails(e.target.value)}
                  placeholder="Enter vendor full name, billing address, and contact person..."
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-[1.5rem] outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] text-sm font-bold text-slate-700 min-h-[140px] resize-none shadow-sm transition-all"
                />
              </div>

              <div className="col-span-12 md:col-span-5 space-y-6">
                <div className="space-y-1.5">
                  <RequisitionLabel label="Order Date *" icon={Calendar} />
                  <input
                    type="date"
                    required
                    value={orderDate}
                    onChange={(e) => setOrderDate(e.target.value)}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] text-sm font-semibold text-slate-700 shadow-sm transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <RequisitionLabel label="Purchase Order # *" />
                  <input
                    type="text"
                    required
                    value={poNumber}
                    onChange={(e) => setPoNumber(e.target.value)}
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] text-sm font-semibold text-slate-700 shadow-sm transition-all"
                  />
                </div>
                <div className="space-y-1.5">
                  <RequisitionLabel label="Payment Terms" icon={CreditCard} />
                  <input
                    type="text"
                    value={paymentTerms}
                    onChange={(e) => setPaymentTerms(e.target.value)}
                    placeholder="e.g., NET 30, Cash on Delivery..."
                    className="w-full px-5 py-3.5 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] text-sm font-bold text-slate-700 shadow-sm transition-all placeholder:text-slate-300"
                  />
                </div>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-6 pt-4 border-t border-slate-200/50">
              <div className="space-y-2">
                <RequisitionLabel label="Bill To" icon={FileText} />
                <textarea
                  value={billTo}
                  onChange={(e) => setBillTo(e.target.value)}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] text-xs font-bold text-slate-700 min-h-[100px] resize-none shadow-sm transition-all"
                />
              </div>
              <div className="space-y-2">
                <RequisitionLabel label="Ship To / Deliver To" icon={Truck} />
                <textarea
                  value={shipTo}
                  onChange={(e) => setShipTo(e.target.value)}
                  className="w-full px-5 py-4 bg-white border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] text-xs font-bold text-slate-700 min-h-[100px] resize-none shadow-sm transition-all"
                />
              </div>
            </div>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-widest flex items-center gap-2">
                <ShoppingCart className="w-4 h-4 text-[#ff8000]" />
                Final Procured Goods/Services
              </h3>
            </div>

            <div className="border border-slate-200 rounded-[2rem] overflow-hidden bg-slate-50/50">
              <table className="w-full text-left border-collapse">
                <thead className="bg-slate-100/80 border-b border-slate-200">
                  <tr className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest">
                    <th className="px-8 py-5 w-24 text-center">Qty</th>
                    <th className="px-8 py-5">Item Name / Service</th>
                    <th className="px-8 py-5 text-right w-48">
                      Unit Price (RWF)
                    </th>
                    <th className="px-8 py-5 text-right w-48 pr-12">
                      Total (RWF)
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {items.map((item, idx) => (
                    <tr
                      key={idx}
                      className="bg-white hover:bg-slate-50/50 transition-colors group"
                    >
                      <td className="px-8 py-5 text-sm font-semibold text-slate-600 text-center">
                        {item.quantity}
                      </td>
                      <td className="px-8 py-5">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold text-slate-800 tracking-tight">
                            {item.name}
                          </span>
                          {item.description && (
                            <span className="text-[10px] text-slate-400 italic mt-0.5">
                              {item.description}
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-8 py-5 text-right text-xs font-bold text-slate-500">
                        {item.unit_price.toLocaleString()}
                      </td>
                      <td className="px-8 py-5 text-right text-sm font-semibold text-slate-900 pr-12">
                        {(item.quantity * item.unit_price).toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="bg-slate-100/50 px-12 py-5 flex justify-end items-center gap-4">
                <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-400">
                  Total Approved Value For Items:
                </span>
                <span className="text-lg font-semibold text-slate-800">
                  {subtotal.toLocaleString()} RWF
                </span>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
            <div className="space-y-8">
              <div className="space-y-1.5">
                <RequisitionLabel label="Period of Performance" icon={Clock} />
                <input
                  type="text"
                  value={periodOfPerformance}
                  onChange={(e) => setPeriodOfPerformance(e.target.value)}
                  placeholder="e.g., Delivery within 5 working days..."
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] text-sm font-bold text-slate-700 shadow-sm transition-all"
                />
              </div>
              <div className="space-y-1.5">
                <RequisitionLabel label="Special Instructions" icon={Plus} />
                <textarea
                  value={specialInstructions}
                  onChange={(e) => setSpecialInstructions(e.target.value)}
                  placeholder="Any specific delivery, warranty, or support terms..."
                  className="w-full px-5 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] text-sm font-medium text-slate-700 min-h-[100px] resize-none shadow-sm transition-all"
                />
              </div>
            </div>

            <div className="space-y-4">
              <RequisitionLabel
                label="Total Authorized Expenditure"
                icon={Calculator}
              />
              <div className="bg-orange-50 p-8 rounded-[2.5rem] border border-orange-100 shadow-sm relative overflow-hidden group">
                <div className="space-y-6 relative z-10">
                  <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-widest text-[#ff8000]">
                    <span>Financial Integrity Check</span>
                    <ShieldAlert className="w-4 h-4" />
                  </div>
                  <div className="space-y-4 divide-y divide-orange-100">
                    <div className="flex justify-between items-center text-slate-400 text-[11px] font-bold pb-2">
                      <span>Items Subtotal</span>
                      <span className="text-slate-600 font-semibold">
                        {subtotal.toLocaleString()} RWF
                      </span>
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-400 text-[11px] font-bold">
                        Logistics & Fees
                      </span>
                      <input
                        type="number"
                        value={shippingCost}
                        onChange={(e) =>
                          setShippingCost(Number(e.target.value))
                        }
                        className="w-24 bg-white border border-orange-50 rounded-lg px-2 py-1 text-right text-xs font-semibold text-orange-600 focus:ring-4 focus:ring-orange-500/10 outline-none"
                      />
                    </div>
                    <div className="flex justify-between items-center pt-2">
                      <span className="text-slate-400 text-[11px] font-bold">
                        Contingency / Other
                      </span>
                      <input
                        type="number"
                        value={otherCost}
                        onChange={(e) => setOtherCost(Number(e.target.value))}
                        className="w-24 bg-white border border-orange-50 rounded-lg px-2 py-1 text-right text-xs font-semibold text-orange-600 focus:ring-4 focus:ring-orange-500/10 outline-none"
                      />
                    </div>
                  </div>
                  <div className="pt-4 flex justify-between items-end">
                    <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400 mb-1">
                      TOTAL PO VALUE
                    </span>
                    <span className="text-3xl font-semibold text-[#ff8000] tracking-tighter">
                      {grandTotal.toLocaleString()}{' '}
                      <span className="text-xs text-orange-300">RWF</span>
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex items-center justify-between gap-4 pt-4 border-t border-slate-100">
            <h3 className="text-xs font-semibold text-slate-800 uppercase tracking-widest flex items-center gap-2">
              <PenTool className="w-4 h-4 text-[#ff8000]" />
              Signing Authorization Method
            </h3>
            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                type="button"
                onClick={() => {
                  setSigningMethod('digital');
                  setIsDigitallySigned(true);
                }}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${signingMethod === 'digital' ? 'bg-white text-[#ff8000] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Digital Signing
              </button>
              <button
                type="button"
                onClick={() => {
                  setSigningMethod('physical');
                  setIsDigitallySigned(false);
                }}
                className={`px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all ${signingMethod === 'physical' ? 'bg-white text-[#ff8000] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
              >
                Physical Signing
              </button>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-10">
            <div className="space-y-4">
              <RequisitionLabel
                label="HISP Authorized Signatory"
                icon={Briefcase}
              />
              <div className="bg-orange-50/30 p-8 rounded-[2.5rem] border border-orange-100 space-y-6">
                <div className="space-y-1.5">
                  <label className="text-[9px] font-semibold text-[#ff8000] uppercase tracking-widest pl-1">
                    Name & Title {signingMethod === 'digital' ? '*' : ''}
                  </label>
                  <input
                    type="text"
                    required={signingMethod === 'digital'}
                    value={hispSignName}
                    onChange={(e) => setHispSignName(e.target.value)}
                    placeholder="Name and Title of authorized HISP signatory..."
                    className="w-full px-5 py-3 bg-white border border-orange-100 rounded-2xl outline-none focus:ring-4 focus:ring-[#ff8000]/10 focus:border-[#ff8000] text-xs font-semibold text-slate-800 shadow-sm transition-all"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest pl-1">
                      Signature
                    </label>
                    <div className="h-10 border-b border-orange-200 flex items-center justify-center text-[10px] italic text-orange-300 font-medium uppercase tracking-widest">
                      {signingMethod === 'digital'
                        ? 'Digital Trace Active'
                        : 'Physical Sign Area'}
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold text-[#ff8000] uppercase tracking-widest pl-1">
                      Sign Date
                    </label>
                    {signingMethod === 'digital' ? (
                      <input
                        type="date"
                        value={hispSignDate}
                        onChange={(e) => setHispSignDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-orange-100 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                      />
                    ) : (
                      <div className="h-10 border-b border-orange-200 flex items-center justify-center text-[10px] italic text-orange-300 font-medium uppercase tracking-widest">
                        Date Manual Fill
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <RequisitionLabel label="Vendor Acceptance" icon={PenTool} />
                {signingMethod === 'digital' && (
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest">
                      Vendor Present?
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsDigitallySigned(!isDigitallySigned)}
                      className={`w-8 h-4 rounded-full transition-all relative ${isDigitallySigned ? 'bg-emerald-500' : 'bg-slate-200'}`}
                    >
                      <div
                        className={`absolute top-0.5 w-3 h-3 rounded-full bg-white transition-all ${isDigitallySigned ? 'left-4.5' : 'left-0.5'}`}
                      />
                    </button>
                  </div>
                )}
              </div>
              <div
                className={`${isDigitallySigned && signingMethod === 'digital' ? 'bg-emerald-50/50 border-emerald-100' : 'bg-slate-50 border-slate-100'} p-8 rounded-[2.5rem] border space-y-6 transition-colors`}
              >
                <div className="space-y-1.5">
                  <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest pl-1">
                    Name & Title
                  </label>
                  <input
                    type="text"
                    value={vendorSignName}
                    onChange={(e) => setVendorSignName(e.target.value)}
                    placeholder="Vendor signatory name..."
                    className={`w-full px-5 py-3 bg-white border rounded-2xl outline-none focus:ring-4 text-xs font-semibold text-slate-800 shadow-sm transition-all ${isDigitallySigned && signingMethod === 'digital' ? 'border-emerald-200 focus:ring-emerald-500/10 focus:border-emerald-500' : 'border-slate-200 focus:ring-slate-500/10 focus:border-slate-500'}`}
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest pl-1">
                      Stamp/Signature
                    </label>
                    {isDigitallySigned && signingMethod === 'digital' ? (
                      <div className="h-10 border-b border-emerald-200 flex items-center justify-center text-lg font-['Dancing_Script',_cursive] text-emerald-600 font-bold">
                        {vendorSignName || 'Awaiting Signature'}
                      </div>
                    ) : (
                      <div className="h-10 border-b border-slate-200 flex items-center justify-center text-[10px] italic text-slate-300 font-medium uppercase tracking-widest">
                        {signingMethod === 'digital'
                          ? 'Manual Fill'
                          : 'Physical Stamp Area'}
                      </div>
                    )}
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-semibold text-slate-400 uppercase tracking-widest pl-1">
                      Sign Date
                    </label>
                    {signingMethod === 'digital' ? (
                      <input
                        type="date"
                        value={vendorSignDate}
                        onChange={(e) => setVendorSignDate(e.target.value)}
                        className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 outline-none"
                      />
                    ) : (
                      <div className="h-10 border-b border-slate-200 flex items-center justify-center text-[10px] italic text-slate-300 font-medium uppercase tracking-widest">
                        Date Manual Fill
                      </div>
                    )}
                  </div>
                </div>
                {isDigitallySigned && signingMethod === 'digital' && (
                  <p className="text-[9px] font-bold text-emerald-600 italic bg-emerald-50 p-2 rounded-lg border border-emerald-100">
                    * By typing the name above, the vendor agrees to the terms
                    of this Purchase Order digitally.
                  </p>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 border-t border-slate-100 pt-8 pb-4">
            <div className="flex items-start gap-4 p-8 bg-slate-50/50 rounded-[2.5rem] border border-slate-100">
              <ShieldAlert className="w-6 h-6 text-[#ff8000] shrink-0" />
              <div className="space-y-3">
                <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-widest leading-none">
                  Authorization & Compliance Notice
                </p>
                <p className="text-xs font-medium text-slate-500 italic leading-relaxed">
                  By issuing this digital Purchase Order, HISP Rwanda confirms
                  that the procurement complies with corporate policies and
                  sufficient funds have been verified.
                </p>
                <div className="pt-2">
                  <p className="text-[10px] font-bold text-orange-700 bg-orange-50 p-3 rounded-xl border border-orange-100">
                    HISP ANTI-MOTIVATION POLICY: Staff members are strictly
                    prohibited from receiving motivation in any form from
                    vendors. Report violations to{' '}
                    <span className="font-semibold underline px-1">
                      @hisprwanda.org
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </form>
        <div className="px-8 py-6 border-t border-slate-100 bg-slate-50/80 shrink-0 flex items-center justify-between">
          <div className="flex-1 text-[10px] font-medium text-slate-400 leading-tight max-w-sm">
            Finalizing this document will generate a binding digital Purchase
            Order associated with Requisition:{' '}
            <span className="font-semibold text-slate-600">
              "{request.title}"
            </span>
            .
          </div>
          <div className="flex gap-4 shrink-0">
            <button
              type="button"
              onClick={onClose}
              className="px-8 py-2.5 bg-white border border-slate-200 hover:bg-slate-50 text-slate-600 text-sm font-bold rounded-xl transition-colors shadow-sm"
              disabled={isPending}
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={() =>
                onConfirm({
                  vendor_details: vendorDetails,
                  po_number: poNumber,
                  order_date: orderDate,
                  payment_terms: paymentTerms,
                  special_instructions: specialInstructions,
                  period_of_performance: periodOfPerformance,
                  shipping_cost: shippingCost,
                  other_cost: otherCost,
                  grand_total: grandTotal,
                  hisp_sign_name: hispSignName,
                  hisp_sign_date: hispSignDate,
                  vendor_sign_name: vendorSignName,
                  vendor_sign_date: vendorSignDate,
                  authorized_by: hispSignName,
                  bill_to: billTo,
                  ship_to: shipTo,
                  is_digitally_signed: signingMethod === 'digital',
                  scanned_po_url: scannedPoUrl,
                })
              }
              disabled={isPending || !vendorDetails || !poNumber}
              className="px-10 py-2.5 bg-[#ff8000] hover:bg-[#e67300] text-white text-sm font-bold rounded-xl shadow-md transform active:scale-95 transition-all flex justify-center items-center gap-2"
            >
              {isPending ? (
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Issue Purchase Order <Send className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      <style
        dangerouslySetInnerHTML={{
          __html: `
        @import url('https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap');
      `,
        }}
      />
    </>
  );
};
