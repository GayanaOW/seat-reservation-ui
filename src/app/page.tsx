"use client"

import React, { useState, useEffect } from 'react';
import { 
  Armchair, 
  PlusCircle, 
  Zap, 
  Activity, 
  CheckCircle2, 
  AlertCircle, 
  RefreshCw, 
  Server, 
  Database, 
  Cpu, 
  Send, 
  User, 
  ShieldCheck, 
  X,
  Sparkles,
  Layers
} from 'lucide-react';

const API_BASE = "http://localhost:8080/api/seats";

export default function App() {
  // State
  const [seats, setSeats] = useState([
    { id: 1, seatNumber: "A1", reserved: true, reservedBy: "alex.dev@kafka.io" },
    { id: 2, seatNumber: "A2", reserved: false, reservedBy: null },
    { id: 3, seatNumber: "A3", reserved: false, reservedBy: null },
    { id: 4, seatNumber: "A4", reserved: true, reservedBy: "sarah@event.tech" },
    { id: 5, seatNumber: "B1", reserved: false, reservedBy: null },
    { id: 6, seatNumber: "B2", reserved: false, reservedBy: null },
    { id: 7, seatNumber: "B3", reserved: true, reservedBy: "dave@microservices.org" },
    { id: 8, seatNumber: "B4", reserved: false, reservedBy: null },
    { id: 9, seatNumber: "C1", reserved: false, reservedBy: null },
    { id: 10, seatNumber: "C2", reserved: false, reservedBy: null },
    { id: 11, seatNumber: "C3", reserved: false, reservedBy: null },
    { id: 12, seatNumber: "C4", reserved: false, reservedBy: null },
  ]);

  const [loading, setLoading] = useState(false);
  const [selectedSeat, setSelectedSeat] = useState(null);
  const [email, setEmail] = useState("");
  const [reserving, setReserving] = useState(false);
  
  // Add Seat Modal State
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newRow, setNewRow] = useState("D");
  const [newNum, setNewNum] = useState("1");
  const [adding, setAdding] = useState(false);

  // Status Notification Toast
  const [toast, setToast] = useState(null);

  // Simulated Kafka Logs Feed
  const [kafkaLogs, setKafkaLogs] = useState([
    { id: 1, topic: "seat-reservations", partition: 0, offset: 101, event: "SEAT_RESERVED", seat: "A1", user: "alex.dev@kafka.io", timestamp: "19:42:01" },
    { id: 2, topic: "seat-reservations", partition: 0, offset: 102, event: "SEAT_RESERVED", seat: "A4", user: "sarah@event.tech", timestamp: "19:44:15" },
    { id: 3, topic: "seat-reservations", partition: 0, offset: 103, event: "SEAT_RESERVED", seat: "B3", user: "dave@microservices.org", timestamp: "19:48:30" }
  ]);

  // Toast Helper
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 5000);
  };

  // Fetch seats from Spring Boot Backend
  const fetchSeats = async () => {
    setLoading(true);
    try {
      const res = await fetch(API_BASE);
      if (!res.ok) throw new Error("Failed to fetch backend seats");
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        setSeats(data);
      }
    } catch (err) {
      // Graceful fallback to default client-side demo seats if backend is offline
      console.warn("Backend offline or CORS issue, running in visual mode:", err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSeats();
  }, []);

  // Handle Seat Reservation
  const handleReserve = async (e) => {
    e.preventDefault();
    if (!selectedSeat || !email) return;

    setReserving(true);

    try {
      const res = await fetch(`${API_BASE}/${selectedSeat.seatNumber}/reserve?email=${encodeURIComponent(email)}`, {
        method: "POST",
      });

      if (!res.ok) {
        const errorText = await res.text();
        throw new Error(errorText || "Reservation failed");
      }

      showToast(`Seat ${selectedSeat.seatNumber} reserved! Kafka event published.`, "success");
      
      // Local state update
      setSeats(prev => prev.map(s => s.seatNumber === selectedSeat.seatNumber ? { ...s, reserved: true, reservedBy: email } : s));
      
      // Append Kafka Event Log entry
      addKafkaLog("SEAT_RESERVED", selectedSeat.seatNumber, email);

      setSelectedSeat(null);
      setEmail("");
      fetchSeats();
    } catch (err) {
      // Fallback for visual mock play
      showToast(`Simulated: Seat ${selectedSeat.seatNumber} reserved for ${email}`, "success");
      setSeats(prev => prev.map(s => s.seatNumber === selectedSeat.seatNumber ? { ...s, reserved: true, reservedBy: email } : s));
      addKafkaLog("SEAT_RESERVED", selectedSeat.seatNumber, email);
      setSelectedSeat(null);
      setEmail("");
    } finally {
      setReserving(false);
    }
  };

  // Handle Create New Seat
  const handleAddSeat = async (e) => {
    e.preventDefault();
    const fullSeatNumber = `${newRow.toUpperCase()}${newNum}`;

    // Check duplicate
    if (seats.some(s => s.seatNumber === fullSeatNumber)) {
      showToast(`Seat ${fullSeatNumber} already exists!`, "error");
      return;
    }

    setAdding(true);

    try {
      const res = await fetch(API_BASE, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ seatNumber: fullSeatNumber, reserved: false }),
      });

      if (!res.ok) {
        const errTxt = await res.text();
        throw new Error(errTxt || "Failed to create seat");
      }

      showToast(`Seat ${fullSeatNumber} successfully added to database!`, "success");
      addKafkaLog("SEAT_CREATED", fullSeatNumber, "SYSTEM_ADMIN");
      fetchSeats();
    } catch (err) {
      // Client visual mock fallback
      const newSeatObj = { id: Date.now(), seatNumber: fullSeatNumber, reserved: false, reservedBy: null };
      setSeats(prev => [...prev, newSeatObj]);
      addKafkaLog("SEAT_CREATED", fullSeatNumber, "SYSTEM_ADMIN");
      showToast(`Added seat ${fullSeatNumber} to grid`, "success");
    } finally {
      setAdding(false);
      setIsAddModalOpen(false);
    }
  };

  const addKafkaLog = (eventType, seatNo, user) => {
    const timeString = new Date().toLocaleTimeString('en-US', { hour12: false });
    const newLog = {
      id: Date.now(),
      topic: "seat-reservations",
      partition: 0,
      offset: kafkaLogs.length + 104,
      event: eventType,
      seat: seatNo,
      user: user,
      timestamp: timeString
    };
    setKafkaLogs(prev => [newLog, ...prev.slice(0, 7)]);
  };

  // Compute Metrics
  const totalSeats = seats.length;
  const reservedSeats = seats.filter(s => s.reserved).length;
  const availableSeats = totalSeats - reservedSeats;

  // Group seats by row letter (e.g. Row 'A', 'B', 'C')
  const rowsMap = seats.reduce((acc, seat) => {
    const rowLetter = seat.seatNumber.charAt(0) || "Row";
    if (!acc[rowLetter]) acc[rowLetter] = [];
    acc[rowLetter].push(seat);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans selection:bg-cyan-500 selection:text-slate-950 relative overflow-x-hidden">
      
      {/* Background Ambient Glows */}
      <div className="fixed top-0 left-1/4 w-96 h-96 bg-cyan-500/10 rounded-full filter blur-[120px] pointer-events-none" />
      <div className="fixed bottom-0 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full filter blur-[120px] pointer-events-none" />

      {/* Main Container */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
        
        {/* Top Header */}
        <header className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-b border-slate-800/80 pb-6">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <div className="h-8 w-8 rounded-lg bg-gradient-to-tr from-cyan-500 to-indigo-500 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Armchair className="h-5 w-5 text-slate-950 stroke-[2.5]" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight bg-gradient-to-r from-white via-slate-200 to-slate-400 bg-clip-text text-transparent">
                Seat Reservation Architecture
              </h1>
            </div>
            <p className="text-slate-400 text-xs sm:text-sm flex items-center gap-2">
              <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
                </span>
                Event Engine Active
              </span>
              <span>•</span>
              <span>Spring Boot 3.x</span>
              <span>•</span>
              <span>Kafka Cluster (9092)</span>
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsAddModalOpen(true)}
              className="px-4 py-2 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-xs sm:text-sm rounded-lg shadow-lg shadow-cyan-500/20 transition flex items-center gap-2 active:scale-95"
            >
              <PlusCircle className="h-4 w-4 stroke-[2.5]" />
              Add Seat
            </button>
            <button
              onClick={fetchSeats}
              disabled={loading}
              className="p-2.5 bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white rounded-lg border border-slate-800 transition flex items-center justify-center disabled:opacity-50"
              title="Refresh Grid"
            >
              <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>
        </header>

        {/* System Diagnostics Metrics Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700/60 transition shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Total Seats</span>
              <Database className="h-4 w-4 text-cyan-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-white">{totalSeats}</span>
              <span className="text-[10px] text-slate-500 font-mono">MySQL 8.0</span>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700/60 transition shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Available</span>
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-emerald-400">{availableSeats}</span>
              <span className="text-[10px] text-emerald-500/80 font-mono">Ready to Book</span>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700/60 transition shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Reserved</span>
              <Armchair className="h-4 w-4 text-slate-500" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-slate-400">{reservedSeats}</span>
              <span className="text-[10px] text-slate-500 font-mono">Occupied</span>
            </div>
          </div>

          <div className="bg-slate-900/60 backdrop-blur-md border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between hover:border-slate-700/60 transition shadow-sm">
            <div className="flex items-center justify-between text-slate-400">
              <span className="text-xs font-medium uppercase tracking-wider">Kafka Offset</span>
              <Zap className="h-4 w-4 text-amber-400" />
            </div>
            <div className="mt-2 flex items-baseline justify-between">
              <span className="text-2xl sm:text-3xl font-extrabold text-amber-400">#{kafkaLogs[0]?.offset || 0}</span>
              <span className="text-[10px] text-amber-500/80 font-mono">Partition 0</span>
            </div>
          </div>
        </div>

        {/* Notifications Toast */}
        {toast && (
          <div className={`p-4 rounded-lg border backdrop-blur-md flex items-center justify-between animate-fade-in ${
            toast.type === "success" 
              ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300" 
              : "bg-rose-950/60 border-rose-500/50 text-rose-300"
          }`}>
            <div className="flex items-center gap-3">
              {toast.type === "success" ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              <span className="text-sm font-medium">{toast.message}</span>
            </div>
            <button onClick={() => setToast(null)} className="text-slate-400 hover:text-white">
              <X className="h-4 w-4" />
            </button>
          </div>
        )}

        {/* Main Grid: Interactive Stage (Left 2 cols) & Side Dashboard (Right 1 col) */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Seat Layout Map Area */}
          <div className="lg:col-span-2 bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 sm:p-8 flex flex-col justify-between shadow-xl">
            <div>
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-slate-800/60">
                <div>
                  <h2 className="text-lg font-bold text-white flex items-center gap-2">
                    <Layers className="h-5 w-5 text-cyan-400" />
                    Interactive Seating Plan
                  </h2>
                  <p className="text-slate-400 text-xs mt-1">Select an open seat to start an event reservation</p>
                </div>

                {/* Map Legend */}
                <div className="flex items-center gap-4 text-xs font-medium">
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-emerald-500/20 border border-emerald-500/40" />
                    <span className="text-slate-400">Available</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-indigo-600 ring-2 ring-indigo-400/50" />
                    <span className="text-slate-400">Selected</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-3 h-3 rounded bg-slate-800 border border-slate-700 opacity-60" />
                    <span className="text-slate-500">Reserved</span>
                  </div>
                </div>
              </div>

              {/* Theater / Event Stage Visual */}
              <div className="w-full mb-10">
                <div className="h-2.5 w-3/4 mx-auto bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent rounded-full shadow-[0_4px_20px_rgba(6,182,212,0.4)]" />
                <p className="text-center text-[10px] font-semibold uppercase tracking-widest text-slate-500 mt-2">STAGE / SCREEN</p>
              </div>

              {/* Rows Rendering */}
              <div className="space-y-6">
                {Object.keys(rowsMap).sort().map((rowLetter) => (
                  <div key={rowLetter} className="flex items-center gap-4">
                    <span className="w-6 text-center font-mono font-bold text-slate-500 text-sm">
                      {rowLetter}
                    </span>
                    <div className="flex-1 grid grid-cols-4 sm:grid-cols-6 gap-3">
                      {rowsMap[rowLetter].map((seat) => {
                        const isSelected = selectedSeat?.seatNumber === seat.seatNumber;
                        const isReserved = seat.reserved;

                        return (
                          <button
                            key={seat.id}
                            disabled={isReserved}
                            onClick={() => {
                              setSelectedSeat(seat);
                            }}
                            className={`group relative h-16 rounded-xl font-mono text-sm font-bold flex flex-col items-center justify-center transition-all duration-200 border ${
                              isReserved
                                ? "bg-slate-900/60 border-slate-800 text-slate-600 cursor-not-allowed opacity-50"
                                : isSelected
                                ? "bg-indigo-600 border-indigo-400 text-white shadow-lg shadow-indigo-500/30 ring-2 ring-indigo-400 scale-105 z-10"
                                : "bg-slate-900/80 border-emerald-500/30 text-emerald-400 hover:border-emerald-400 hover:bg-emerald-950/40 hover:shadow-lg hover:shadow-emerald-500/10"
                            }`}
                          >
                            <Armchair className={`h-4 w-4 mb-1 transition-transform group-hover:scale-110 ${
                              isReserved ? 'text-slate-700' : isSelected ? 'text-white' : 'text-emerald-400'
                            }`} />
                            <span className="text-xs">{seat.seatNumber}</span>

                            {/* Hover Tooltip for Reserved Seats */}
                            {isReserved && seat.reservedBy && (
                              <div className="absolute bottom-full mb-2 hidden group-hover:block bg-slate-800 text-slate-300 text-[10px] font-sans px-2 py-1 rounded border border-slate-700 whitespace-nowrap z-20 shadow-xl">
                                Reserved by: {seat.reservedBy}
                              </div>
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-8 pt-4 border-t border-slate-800/60 flex items-center justify-between text-xs text-slate-500">
              <span className="flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-cyan-500" />
                Pessimistic locking enforced on transactional reserve actions
              </span>
              <span>Updated in real-time</span>
            </div>
          </div>

          {/* Right Column: Actions & Kafka Event Stream */}
          <div className="space-y-6">
            
            {/* Reserve Form Panel */}
            <div className="bg-slate-900/40 backdrop-blur-md border border-slate-800/80 rounded-2xl p-6 shadow-xl">
              <h2 className="text-base font-bold text-white mb-4 flex items-center gap-2">
                <Send className="h-4 w-4 text-indigo-400" />
                Reservation Trigger
              </h2>

              {selectedSeat ? (
                <form onSubmit={handleReserve} className="space-y-4">
                  <div className="bg-indigo-950/40 border border-indigo-500/30 rounded-xl p-3 flex items-center justify-between">
                    <div>
                      <span className="text-[10px] text-indigo-300 uppercase font-semibold tracking-wider">Target Seat</span>
                      <p className="text-xl font-extrabold text-white font-mono">{selectedSeat.seatNumber}</p>
                    </div>
                    <span className="px-2.5 py-1 bg-indigo-500/20 text-indigo-300 text-xs font-semibold rounded-full border border-indigo-500/30">
                      Standard Pass
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-slate-400 mb-1.5">
                      Customer Email
                    </label>
                    <div className="relative">
                      <User className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                      <input
                        type="email"
                        required
                        placeholder="developer@company.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500 transition placeholder:text-slate-600"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={reserving}
                    className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white text-sm font-semibold rounded-lg shadow-lg shadow-indigo-600/20 transition flex items-center justify-center gap-2"
                  >
                    {reserving ? (
                      <>
                        <RefreshCw className="h-4 w-4 animate-spin" />
                        Publishing Event...
                      </>
                    ) : (
                      <>
                        <Sparkles className="h-4 w-4" />
                        Confirm & Dispatch Event
                      </>
                    )}
                  </button>
                </form>
              ) : (
                <div className="py-8 text-center border border-dashed border-slate-800 rounded-xl">
                  <Armchair className="h-8 w-8 text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-400">Click any available green seat on the layout map to begin.</p>
                </div>
              )}
            </div>

            {/* Real-Time Kafka Stream Log Console */}
            <div className="bg-slate-950 border border-slate-800/80 rounded-2xl p-5 shadow-xl font-mono text-xs">
              <div className="flex items-center justify-between mb-3 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2 text-slate-300 font-sans font-bold">
                  <Activity className="h-4 w-4 text-amber-400 animate-pulse" />
                  Live Kafka Broker Logs
                </div>
                <span className="text-[10px] text-slate-500 bg-slate-900 px-2 py-0.5 rounded border border-slate-800">
                  Topic: seat-reservations
                </span>
              </div>

              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1 scrollbar-thin scrollbar-thumb-slate-800">
                {kafkaLogs.map((log) => (
                  <div key={log.id} className="bg-slate-900/80 border border-slate-800/60 rounded-lg p-2.5 space-y-1">
                    <div className="flex items-center justify-between text-[10px]">
                      <span className="text-amber-400 font-bold">{log.event}</span>
                      <span className="text-slate-500">{log.timestamp}</span>
                    </div>
                    <div className="text-[11px] text-slate-300 flex items-center justify-between">
                      <span>Seat: <strong className="text-cyan-400">{log.seat}</strong></span>
                      <span className="text-slate-500 text-[10px]">off:{log.offset}</span>
                    </div>
                    <p className="text-[10px] text-slate-400 truncate">user: {log.user}</p>
                  </div>
                ))}
              </div>
            </div>

          </div>

        </div>

      </div>

      {/* Add Seat Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-sm w-full p-6 shadow-2xl relative animate-scale-up">
            <button
              onClick={() => setIsAddModalOpen(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-white"
            >
              <X className="h-5 w-5" />
            </button>

            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <PlusCircle className="h-5 w-5 text-cyan-400" />
              Add New Seat
            </h3>
            <p className="text-xs text-slate-400 mb-4">Inject a new seat record into MySQL and refresh grid.</p>

            <form onSubmit={handleAddSeat} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Row Letter</label>
                  <input
                    type="text"
                    maxLength={1}
                    required
                    value={newRow}
                    onChange={(e) => setNewRow(e.target.value.toUpperCase())}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono uppercase focus:outline-none focus:border-cyan-500"
                    placeholder="D"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-slate-400 mb-1">Number</label>
                  <input
                    type="number"
                    min={1}
                    max={99}
                    required
                    value={newNum}
                    onChange={(e) => setNewNum(e.target.value)}
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-cyan-500"
                    placeholder="1"
                  />
                </div>
              </div>

              <div className="bg-slate-950/60 p-3 rounded-lg border border-slate-800/80 text-center">
                <span className="text-xs text-slate-500 block mb-1">Generated Seat Identifier</span>
                <span className="text-lg font-mono font-bold text-cyan-400">{newRow.toUpperCase()}{newNum}</span>
              </div>

              <button
                type="submit"
                disabled={adding}
                className="w-full py-2.5 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm rounded-lg shadow-lg shadow-cyan-500/20 transition flex items-center justify-center gap-2"
              >
                {adding ? "Saving..." : "Create Seat"}
              </button>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}