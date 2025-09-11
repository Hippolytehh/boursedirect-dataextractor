import './App.css';
import { useEffect, useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function App() {

  const url = "https://www.boursedirect.fr";

  const [formData, setFormData] = useState({
    startYear: new Date().getFullYear() - 1,
    endYear: new Date().getFullYear(),
    accountNumber: 1,
  });
  const [canSubmit, setCanSubmit] = useState(true);

  useEffect(() => {
    // Only enable submit if chrome.tabs.query is available
    setCanSubmit(!!(chrome && chrome.tabs && chrome.tabs.query));
  }, []);

  const handleChange = (e: React.ChangeEvent<any>) => {
    const { id, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // Check if on the right website
    if (chrome?.tabs?.query) {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      const isRightWebsite = tab.url?.startsWith(url);
      if (!isRightWebsite) {
        toast.error(`Please navigate to ${url} to use this feature.`, {
          autoClose: false,
          toastId: 'wrong-website',
        });
        return;
      }
    };
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
    }
    const toastLoading = toast.loading('Loading');
    try {
      const startYear = formData.startYear;
      const endYear = formData.endYear;
      const accountNumber = formData.accountNumber;

      const urls = Array.from({ length: endYear - startYear + 1 }, (_, i) => startYear + i)
        .flatMap(year =>
          Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'))
            .flatMap(month =>
              Array.from({ length: 31 }, (_, i) => String(i + 1).padStart(2, '0'))
                .map(day =>
                  `https://www.boursedirect.fr/priv/new/releveOpe.php?nc=${accountNumber}&type=RO&year=${year}&month=${month}&day=${day}&trash=/avis.pdf`
                )
            )
        );

      const testUrls = async (urlsToTest: string[]) => {
        const results = await Promise.all(
          urlsToTest.map(async (url) => {
            try {
              const response = await fetch(url, { method: 'GET' }); // Use HEAD to just get headers
              const html = await response.text();
              return { url, status: response.status, hasReleve: html.startsWith("Erreur fatale veuillez contacter le support Capitol") ? false : true, content: html };
            } catch (error: any) {
              return { url, error: error.message };
            }
          })
        );
        const hasReleveResults = results.filter(result => result.hasReleve);
        return hasReleveResults;
      };

      const relevesArr = await testUrls(urls);
      localStorage.setItem('releves', JSON.stringify(relevesArr));

      const releves = JSON.parse(localStorage.getItem('releves') || '[]');

      const parser = new DOMParser();

      const formattedReleves = (await Promise.all(
        releves.map(async (item: any) => {
          const subDocument = parser.parseFromString(item.content, 'text/html');
          const htmlTable = subDocument.querySelector("table tr:nth-child(3) table")?.outerHTML;
          if (!htmlTable) { throw new Error("No table found.")};
          try {
            const response = await fetch("http://localhost:3000/format-releve", {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json'
              },
              body: JSON.stringify({ htmlTable: htmlTable, url: item.url })
            });
            return await response.json();
          } catch (error: any) {
            return { error: error.message, url: item.url };
          }
        })
      )).flat();

      const operations = await fetch("http://localhost:3000/convert-releves-to-operations", {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ formattedReleves })
      }).then(response => response.json());

      console.log(operations);

      toast.success('Form submitted', {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });

    } catch (Exception: any) {
      toast.error(`${Exception}`, {
        position: "top-right",
        autoClose: 2000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
        progress: undefined,
      });
      return;
    }
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
            <label htmlFor="startYear" className="block text-sm font-medium text-gray-700">
              Start Date
            </label>
            <input
              type="number"
              id="startYear"
              min={2000}
              max={new Date().getFullYear()}
              value={formData.startYear}
              onChange={handleChange}
              className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>
          <div>
            <label htmlFor="endYear" className="block text-sm font-medium text-gray-700">
              End Date
            </label>
            <input
              type="number"
              id="endYear"
              min={2000}
              max={new Date().getFullYear()}
              value={formData.endYear}
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
              className={
                `w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium
                ${canSubmit
                  ? 'text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 cursor-pointer'
                  : 'text-gray-300 bg-gray-400 cursor-not-allowed'}
                `
              }
              disabled={!canSubmit}
              title={!canSubmit ? 'This feature is only available in the Chrome extension context.' : undefined}
            >
              Start
            </button>
          </div>
        </form>
      </div>
      <ToastContainer />
    </div>
  );
}

export default App
