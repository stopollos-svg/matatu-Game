
import React, { useState } from 'react';

interface PaymentModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (amount: number) => void;
}

const PaymentModal: React.FC<PaymentModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [network, setNetwork] = useState<'MTN' | 'AIRTEL' | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [amount] = useState(1000); // 1000 UGX for 5000 Coins

  if (!isOpen) return null;

  const handlePayment = () => {
    if (!phoneNumber || !network) return;

    setIsProcessing(true);

    // --- INTEGRATION NOTE ---
    // In a real app, you would send a POST request to your backend here.
    // Your backend would then call the MTN MoMo API or Airtel Money API.
    // Example: fetch('https://your-api.com/pay', { body: { phone: phoneNumber, network: network } })
    
    // SIMULATION
    setTimeout(() => {
        setIsProcessing(false);
        onSuccess(5000); // Award 5000 coins
        onClose();
        alert(`Payment Successful! Push notification sent to ${phoneNumber}.`);
    }, 2500);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-[60] p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-sm overflow-hidden animate-in fade-in zoom-in">
        <div className="bg-yellow-500 p-4 text-white flex justify-between items-center">
            <h2 className="text-xl font-bold">Mobile Money Top-up</h2>
            <button onClick={onClose}>✕</button>
        </div>

        <div className="p-6">
            <div className="text-center mb-6">
                <p className="text-gray-500 text-sm">Buy 5,000 Coins</p>
                <div className="text-3xl font-bold text-gray-800">UGX {amount.toLocaleString()}</div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Select Network</label>
                    <div className="grid grid-cols-2 gap-4">
                        <button 
                            onClick={() => setNetwork('MTN')}
                            className={`p-3 rounded-lg border-2 font-bold transition-all ${network === 'MTN' ? 'border-yellow-400 bg-yellow-50 text-yellow-700' : 'border-gray-200 text-gray-500'}`}
                        >
                            🟡 MTN MoMo
                        </button>
                        <button 
                            onClick={() => setNetwork('AIRTEL')}
                            className={`p-3 rounded-lg border-2 font-bold transition-all ${network === 'AIRTEL' ? 'border-red-500 bg-red-50 text-red-700' : 'border-gray-200 text-gray-500'}`}
                        >
                            🔴 Airtel Money
                        </button>
                    </div>
                </div>

                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">Phone Number</label>
                    <div className="relative">
                        <span className="absolute left-3 top-3 text-gray-500 font-mono">+256</span>
                        <input 
                            type="tel" 
                            value={phoneNumber}
                            onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g,''))}
                            maxLength={9}
                            className="w-full pl-14 pr-4 py-2 border-2 border-gray-300 rounded-lg focus:outline-none focus:border-green-500 font-mono text-lg"
                            placeholder="770000000"
                        />
                    </div>
                </div>

                <button 
                    onClick={handlePayment}
                    disabled={isProcessing || !phoneNumber || !network || phoneNumber.length < 9}
                    className={`w-full py-3 rounded-lg font-bold text-white text-lg shadow-md transition-all ${isProcessing ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}`}
                >
                    {isProcessing ? 'Waiting for PIN...' : 'PAY NOW'}
                </button>
                
                <p className="text-xs text-center text-gray-400 mt-2">
                    Secured by Mobile Money. A prompt will appear on your phone to enter PIN.
                </p>
            </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentModal;
