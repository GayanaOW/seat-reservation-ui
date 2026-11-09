"use client";

import { useEffect, useState } from "react";

interface Seat {
  id: number;
  seatNumber: string;
  reserved: boolean;
  reservedBy: string | null;
}

const API_BASE = "http://localhost:8080/api/seats";

export default function Home() {
  const [seats, setSeats] = useState<Seat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSeat, setSelectedSeat] = useState<Seat | null>(null);
  const [email, setEmail] = useState("");
  const [reserving, setReserving] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);

  // Load seats from backend
  const fetchSeats = async () => {
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to fetch seats");
      const data: Seat[] = await res.json();
      setSeats(data);
      setError(null);
    } catch (err: any) {
      setError("Could not connect to Spring Boot API. Make sure backend is running on port 8080.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
  }, []);

  // Handle seat reservation
  const handleReserve = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSeat || !email) return;

    setReserving(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`${API_BASE}/${selectedSeat.seatNumber}/reserve?email=${encodeURIComponent(email)}`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Reservation failed");
      }

      setStatusMessage({
        text: `Seat ${selectedSeat.seatNumber} successfully reserved for ${email}! Event published to Kafka.`,
        type: "success",
      });
      setSelectedSeat(null);
      setEmail("");
      fetchSeats(); // Refresh seat grid
    } catch (err: any) {
      setStatusMessage({ text: err.message || "Failed to reserve seat", type: "error" });
    } finally {
      setReserving(false);
    }
  };

  return (
    <main className="min-h-screen bg-slate-900 text-slate-100 p-8 font-sans">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Header */}
        <header className="border-b border-slate-800 pb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Event-Driven Seat Reservation</h1>
            <p className="text-slate-400 text-sm mt-1">Spring Boot • MySQL • Apache Kafka • Next.js</p>
          </div>
          <button
            onClick={fetchSeats}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-xs font-semibold rounded-md border border-slate-700 transition"
          >
            Refresh Seats
          </button>
        </header>

        {/* Status Alerts */}
        {statusMessage && (
          <div
            className={`p-4 rounded-lg text-sm font-medium border ${
              statusMessage.type === "success"
                ? "bg-emerald-950/50 border-emerald-500/50 text-emerald-300"
                : "bg-rose-950/50 border-rose-500/50 text-rose-300"
            }`}
          >
            {statusMessage.text}
          </div>
        )}

        {error && (
          <div className="p-4 rounded-lg text-sm font-medium bg-rose-950/50 border border-rose-500/50 text-rose-300">
            {error}
          </div>
        )}

        {/* Main Grid & Reservation Panel */}
        <div className="grid md:grid-cols-3 gap-8">
          
          {/* Seat Map (2 Cols) */}
          <div className="md:col-span-2 bg-slate-800/50 border border-slate-800 rounded-xl p-6">
            <h2 className="text-lg font-semibold mb-4 text-slate-200">Select a Seat</h2>
            
            {loading ? (
              <p className="text-slate-500 text-sm">Loading seats...</p>
            ) : seats.length === 0 ? (
              <p className="text-slate-400 text-sm">No seats found in database.</p>
            ) : (
              <div className="grid grid-cols-4 gap-4">
                {seats.map((seat) => (
                  <button
                    key={seat.id}
                    disabled={seat.reserved}
                    onClick={() => {
                      setSelectedSeat(seat);
                      setStatusMessage(null);
                    }}
                    className={`h-20 rounded-lg font-bold text-sm flex flex-col items-center justify-center border transition-all ${
                      seat.reserved
                        ? "bg-slate-800 border-slate-700 text-slate-500 cursor-not-allowed opacity-60"
                        : selectedSeat?.seatNumber === seat.seatNumber
                        ? "bg-indigo-600 border-indigo-400 text-white ring-2 ring-indigo-400/50 scale-105"
                        : "bg-emerald-950/30 border-emerald-600/40 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-900/40"
                    }`}
                  >
                    <span>{seat.seatNumber}</span>
                    <span className="text-[10px] font-normal mt-1">
                      {seat.reserved ? "RESERVED" : "AVAILABLE"}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Reservation Action Panel (1 Col) */}
          <div className="bg-slate-800/50 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
            <div>
              <h2 className="text-lg font-semibold mb-4 text-slate-200">Reserve Details</h2>
              {selectedSeat ? (
                <form onSubmit={handleReserve} className="space-y-4">
                  <div>
                    <label className="block text-xs text-slate-400 uppercase font-medium mb-1">Selected Seat</label>
                    <div className="text-xl font-bold text-indigo-400">{selectedSeat.seatNumber}</div>
                  </div>

                  <div>
                    <label className="block text-xs text-slate-400 uppercase font-medium mb-1">Customer Email</label>
                    <input
                      type="email"
                      required
                      placeholder="user@example.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={reserving}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg transition"
                  >
                    {reserving ? "Processing..." : "Confirm Reservation"}
                  </button>
                </form>
              ) : (
                <p className="text-slate-500 text-sm">Click any available seat from the grid to initiate reservation.</p>
              )}
            </div>
          </div>

        </div>
      </div>
    </main>
  );
}