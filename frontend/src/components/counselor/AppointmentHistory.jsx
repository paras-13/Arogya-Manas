// src/components/counselor/AppointmentHistory.jsx
import { useState, useRef } from "react";
import { useCounselorApi } from "../apiLinks/useCounselorApi";
import { Dialog } from "@headlessui/react";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

export default function AppointmentHistory() {
  const { useAppointments, usePrescription } = useCounselorApi();
  const { data: appointments = [], isLoading } = useAppointments();

  const [selectedAppointment, setSelectedAppointment] = useState(null);
  const { data: prescriptionData, refetch } = usePrescription(
    selectedAppointment || 0
  );

  const pdfRef = useRef();

  if (isLoading) return <p>Loading appointments...</p>;

  const handleViewPrescription = (id) => {
    setSelectedAppointment(id);
    refetch();
  };

  const downloadPDF = async () => {
    const element = pdfRef.current;
    if (!element) return;

    const canvas = await html2canvas(element, { scale: 2 });
    const imgData = canvas.toDataURL("image/png");

    const pdf = new jsPDF("p", "mm", "a4");
    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
    pdf.save(`ArogyaManas_Prescription_${selectedAppointment}.pdf`);
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        My Appointments
      </h2>

      <div className="space-y-3 max-h-96 overflow-y-auto">
        {appointments.map((a) => (
          <div
            key={a.id}
            className="p-3 border border-gray-200 rounded-lg hover:shadow-sm transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <p className="font-semibold text-gray-800">{a.counselor}</p>
                <p className="text-gray-600 text-sm mt-1">
                  {a.date} at {a.time}
                </p>
              </div>

              <span
                className={`text-sm px-3 py-1 rounded-md capitalize ${
                  a.status === "completed"
                    ? "bg-green-100 text-green-700"
                    : a.status === "pending"
                    ? "bg-yellow-100 text-yellow-700"
                    : "bg-gray-100 text-gray-700"
                }`}
              >
                {a.status}
              </span>
            </div>

            {a.status === "completed" && (
              <button
                onClick={() => handleViewPrescription(a.id)}
                className="mt-3 bg-indigo-600 text-white px-4 py-2 rounded-md text-sm hover:bg-indigo-700 transition"
              >
                View Prescription
              </button>
            )}
          </div>
        ))}
      </div>

      {/* 🧾 Prescription Modal */}
      <Dialog
        open={!!selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        className="relative z-50"
      >
        <div className="fixed inset-0 bg-black/40" aria-hidden="true" />

        <div className="fixed inset-0 flex items-center justify-center p-4">
          <Dialog.Panel className="bg-white rounded-2xl p-6 shadow-lg max-w-lg w-full transform transition-all">
            <Dialog.Title className="text-xl font-semibold text-gray-800 mb-4">
              Counselor’s Prescription
            </Dialog.Title>

            <div
              ref={pdfRef}
              className="bg-white p-4 rounded-xl border border-gray-200"
            >
              <div className="flex justify-between items-center mb-3">
                <img
                  src="/logo.png"
                  alt="ArogyaManas"
                  className="h-10 w-auto"
                />
                <span className="text-sm text-gray-500">
                  ArogyaManas Portal
                </span>
              </div>

              <div className="border-b border-gray-200 pb-2 mb-3">
                <p className="text-sm text-gray-600">
                  <strong>Date:</strong> {prescriptionData?.date || "—"}
                </p>
                <p className="text-sm text-gray-600">
                  <strong>Counselor:</strong>{" "}
                  {appointments.find((a) => a.id === selectedAppointment)
                    ?.counselor || "—"}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                  Notes:
                </h3>
                <p className="text-gray-700 leading-relaxed whitespace-pre-wrap">
                  {prescriptionData?.notes || "No prescription available."}
                </p>
              </div>

              <div className="mt-6 text-right">
                <p className="text-gray-500 text-sm italic">
                  — Counselor’s Signature
                </p>
              </div>
            </div>

            <div className="mt-4 flex justify-between">
              <button
                onClick={downloadPDF}
                className="bg-green-600 text-white px-4 py-2 rounded-md hover:bg-green-700 transition"
              >
                Download PDF
              </button>
              <button
                onClick={() => setSelectedAppointment(null)}
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded-md hover:bg-gray-400 transition"
              >
                Close
              </button>
            </div>
          </Dialog.Panel>
        </div>
      </Dialog>
    </div>
  );
}
