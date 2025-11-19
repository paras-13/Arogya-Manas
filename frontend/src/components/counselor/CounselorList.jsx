// src/components/counselor/CounselorList.jsx
import { useState } from "react";
import { toast } from "react-toastify";
import { useCounselorApi } from "../apiLinks/useCounselorApi";

export default function CounselorList() {
  const { useCounselorList, useBookAppointment } = useCounselorApi();
  const { data: counselors = [], isLoading } = useCounselorList();
  const bookMutation = useBookAppointment();

  const [selected, setSelected] = useState(null);
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");

  if (isLoading) return <p>Loading counselors...</p>;

  const handleBook = (id) => {
    if (!date || !time) {
      toast.error("Please select date and time!");
      return;
    }
    bookMutation.mutate(
      { counselor_id: id, date, time },
      { onSuccess: () => toast.success("Appointment booked!") }
    );
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-md">
      <h2 className="text-xl font-semibold text-gray-700 mb-4">
        Available Counselors
      </h2>

      <div className="space-y-4">
        {counselors.map((c) => (
          <div
            key={c.id}
            className="border border-gray-200 rounded-xl p-4 hover:shadow transition"
          >
            <div className="flex justify-between items-center">
              <div>
                <h3 className="text-lg font-semibold text-gray-800">
                  {c.name}
                </h3>
                <p className="text-gray-600 text-sm">
                  {c.specialization} • {c.experience} yrs exp.
                </p>
                <p className="text-gray-500 text-sm mt-1 italic">{c.bio}</p>
              </div>
              <button
                onClick={() => setSelected(selected === c.id ? null : c.id)}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg hover:bg-indigo-700 transition"
              >
                {selected === c.id ? "Cancel" : "Book"}
              </button>
            </div>

            {selected === c.id && (
              <div className="mt-4 flex flex-col sm:flex-row gap-3">
                <input
                  type="date"
                  className="border p-2 rounded-md flex-1"
                  onChange={(e) => setDate(e.target.value)}
                />
                <input
                  type="time"
                  className="border p-2 rounded-md flex-1"
                  onChange={(e) => setTime(e.target.value)}
                />
                <button
                  onClick={() => handleBook(c.id)}
                  className="bg-green-500 text-white px-4 py-2 rounded-md hover:bg-green-600 transition"
                >
                  Confirm
                </button>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
