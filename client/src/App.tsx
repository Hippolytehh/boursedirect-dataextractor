import './App.css';
import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {

  const url = "https://www.boursedirect.fr";
  useEffect(() => {
    let toastId = null;

    const checkUrl = async () => {
      if (!chrome?.tabs?.query) return;

      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const isRightWebsite = tab.url?.startsWith(url);

      if (!isRightWebsite && !toast.isActive(toastId!)) {
        toastId = toast.error(
          `Please navigate to ${url} to use this feature.`,
          { autoClose: false, toastId: 'wrong-website' }
        );
      } else if (isRightWebsite && toast.isActive(toastId!)) {
        toast.dismiss(toastId!);
        toastId = null;
      }
    };

    checkUrl();
    const interval = setInterval(checkUrl, 2000);

    return () => {
      clearInterval(interval);
      if (toast.isActive(toastId!)) toast.dismiss(toastId!);
    };
  }, []);

  const [formData, setFormData] = useState({
    startDate: new Date(2020, 1, 1).toISOString().substring(0, 10),
    endDate: new Date(Date()).toISOString().substring(0, 10),
    accountNumber: 1,
  });

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = (e: React.ChangeEvent<any>) => {
    e.preventDefault();
    // Handle form submission logic here
    const emptyFields = Object.entries(formData).filter(x => !x[1]);
    if (emptyFields.length) {
      toast.error(`Please fill in the following fields: ${emptyFields.map(x => x[0]).join(', ')}`, {
          position: "top-right",
          autoClose: 2000,
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
        });
        return;
    };
    toast.success('Form submitted', {
      position: "top-right",
      autoClose: 2000,
      hideProgressBar: false,
      closeOnClick: true,
      pauseOnHover: true,
      draggable: true,
      progress: undefined,
    });
    console.log('Form submitted:', formData);
  };

  const onClick = async () => {
    let [tab] = await chrome.tabs.query({ active: true });
    tab.url;
  };

  return (
    <div className="min-w-[350px] flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-100 to-green-50 p-4">
      <div className="w-full max-w-md p-8 space-y-6 bg-white rounded-xl shadow-lg border border-indigo-200">
        <div className="flex justify-center mb-6">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-16 w-16 text-green-500"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9"
            />
          </svg>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="date"
              id="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="date"
              id="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700">
              Account Number (1-2)
            </label>
            <input
              type="number"
              id="accountNumber"
              min="1"
              max="2"
              value={formData.accountNumber}
              onChange={handleChange}
              placeholder="Enter account number"
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div className="pt-4">
            <button
              type="submit"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
            >
              Start
            </button>
          </div>
        </form>
          <div className="pt-4">
            <button
              type="button"
              className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer"
              onClick={onClick}
            >
              Test
            </button>
          </div>
      </div>
      <ToastContainer />
    </div>
  );
}

export default App
