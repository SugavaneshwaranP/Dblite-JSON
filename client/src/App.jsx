import React, { useState, useMemo, useCallback } from "react";
import { Bar } from "react-chartjs-2";
import "chart.js/auto";

export default function App() {
  const [queryType, setQueryType] = useState("simple"); // "simple" or "sql"
  const [filters, setFilters] = useState({
    occupation: "",
    gender: "",
    age: ""
  });
  const [sqlQuery, setSqlQuery] = useState("SELECT * FROM users LIMIT 10");
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [queryHistory, setQueryHistory] = useState([]);

  const suggestedQueries = [
    "SELECT * FROM users LIMIT 10",
    "SELECT Occupation, COUNT(*) as count FROM users GROUP BY Occupation",
    "SELECT Gender, AVG(Age) as average_age FROM users GROUP BY Gender",
    "SELECT Marital_Status, COUNT(*) as count FROM users GROUP BY Marital_Status",
    "SELECT Occupation, AVG(Age) as average_age FROM users GROUP BY Occupation"
  ];

  const fetchSimpleData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const queryParams = new URLSearchParams();
      if (filters.occupation) queryParams.append("occupation", filters.occupation);
      if (filters.gender) queryParams.append("gender", filters.gender);
      if (filters.age) queryParams.append("age", filters.age);

      const res = await fetch(`http://localhost:5000/api/plfs/data?${queryParams}`);
      
      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Failed to fetch data");
      }

      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const fetchSqlData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`http://localhost:5000/api/plfs/query`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ query: sqlQuery }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || "Query execution failed");
      }

      const json = await res.json();
      setData(json);
      setQueryHistory((prev) => [sqlQuery, ...prev.slice(0, 4)]);
    } catch (err) {
      setError(err.message);
      setData([]);
    } finally {
      setLoading(false);
    }
  }, [sqlQuery]);

  const chartData = useMemo(() => ({
    labels: data.map((_, idx) => `Row ${idx + 1}`),
    datasets: [{
      label: "Age Distribution",
      data: data.map((item) => item.Age || Math.floor(Math.random() * 100)),
      backgroundColor: "rgba(59, 130, 246, 0.85)",
      borderRadius: 6,
      barPercentage: 0.6,
    }],
  }), [data]);

  return (
    <div className="font-sans bg-gradient-to-br from-indigo-50 via-purple-100 to-pink-50 min-h-screen flex flex-col">
      {/* Navbar */}
      <nav className="bg-gradient-to-r from-purple-700 via-pink-600 to-red-500 text-white p-4 md:p-6 flex flex-col md:flex-row justify-between items-center shadow-lg sticky top-0 z-50">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-widest drop-shadow-lg cursor-default mb-2 md:mb-0">
          📊 <span className="text-yellow-300">Survey API Gateway</span>
        </h1>
        <div className="flex space-x-4 md:space-x-8 text-sm md:text-lg font-semibold">
          {["Home", "Query Builder", "Visualization"].map((label) => (
            <a
              key={label}
              href={`#${label.toLowerCase().replace(/\s/g, "")}`}
              className="relative group text-white hover:text-yellow-400 transition-colors"
            >
              {label}
              <span className="absolute left-0 -bottom-1 w-0 group-hover:w-full h-0.5 bg-yellow-400 rounded transition-all duration-300"></span>
            </a>
          ))}
        </div>
      </nav>

      {/* Home Section */}
      <section id="home" className="p-6 md:p-10 max-w-6xl mx-auto text-center">
        <h2 className="text-3xl md:text-5xl font-extrabold mb-6 text-transparent bg-clip-text bg-gradient-to-r from-pink-500 via-purple-700 to-indigo-600">
          User Data Explorer
        </h2>
        <p className="max-w-3xl mx-auto text-base md:text-lg text-gray-700 font-medium leading-relaxed mb-8">
          Explore user data with simple filters or write custom SQL queries to analyze the dataset.
        </p>
      </section>

      {/* Query Builder Section */}
      <section id="querybuilder" className="p-6 md:p-8 bg-white shadow-xl md:shadow-2xl rounded-xl md:rounded-3xl max-w-6xl mx-auto my-8 md:my-12">
        <div className="flex space-x-4 mb-6">
          <button
            onClick={() => setQueryType("simple")}
            className={`px-4 py-2 rounded-lg ${queryType === "simple" ? "bg-purple-600 text-white" : "bg-gray-200"}`}
          >
            Simple Filters
          </button>
          <button
            onClick={() => setQueryType("sql")}
            className={`px-4 py-2 rounded-lg ${queryType === "sql" ? "bg-purple-600 text-white" : "bg-gray-200"}`}
          >
            SQL Query
          </button>
        </div>

        {queryType === "simple" ? (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-purple-700 tracking-wide">
              Filter Users
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 mb-6 md:mb-8">
              <input
                name="occupation"
                value={filters.occupation}
                onChange={(e) => setFilters({...filters, occupation: e.target.value})}
                placeholder="Occupation"
                className="border border-purple-400 rounded-lg p-3 focus:ring-2 focus:ring-purple-300"
              />
              <input
                name="gender"
                value={filters.gender}
                onChange={(e) => setFilters({...filters, gender: e.target.value})}
                placeholder="Gender"
                className="border border-purple-400 rounded-lg p-3 focus:ring-2 focus:ring-purple-300"
              />
              <input
                name="age"
                value={filters.age}
                onChange={(e) => setFilters({...filters, age: e.target.value})}
                placeholder="Age Range (e.g. 20-40)"
                className="border border-purple-400 rounded-lg p-3 focus:ring-2 focus:ring-purple-300"
              />
            </div>
            <button
              onClick={fetchSimpleData}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-6 py-3 rounded-lg hover:shadow-lg transition-all"
            >
              {loading ? "Loading..." : "Get Data"}
            </button>
          </>
        ) : (
          <>
            <h2 className="text-2xl md:text-3xl font-bold mb-6 text-purple-700 tracking-wide">
              SQL Query Builder
            </h2>
            <textarea
              value={sqlQuery}
              onChange={(e) => setSqlQuery(e.target.value)}
              className="w-full h-32 p-4 border border-purple-400 rounded-lg font-mono text-sm mb-4 focus:ring-2 focus:ring-purple-300"
              placeholder="Enter your SQL query..."
            />
            
            <div className="mb-6">
              <h3 className="text-lg font-semibold mb-2 text-gray-700">Suggested Queries:</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {suggestedQueries.map((suggestedQuery, idx) => (
                  <button
                    key={idx}
                    onClick={() => setSqlQuery(suggestedQuery)}
                    className="text-left p-3 bg-gray-100 hover:bg-purple-100 rounded-lg text-sm font-mono transition-colors"
                  >
                    {suggestedQuery}
                  </button>
                ))}
              </div>
            </div>

            <button
              onClick={fetchSqlData}
              disabled={loading}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-bold px-6 py-3 rounded-lg hover:shadow-lg transition-all mb-4"
            >
              {loading ? "Executing..." : "Execute Query"}
            </button>

            {queryHistory.length > 0 && (
              <div className="mt-4">
                <h3 className="text-lg font-semibold mb-2 text-gray-700">Recent Queries:</h3>
                <ul className="space-y-2">
                  {queryHistory.map((historyQuery, idx) => (
                    <li key={idx}>
                      <button
                        onClick={() => setSqlQuery(historyQuery)}
                        className="text-left p-2 w-full bg-gray-50 hover:bg-purple-50 rounded text-sm font-mono transition-colors"
                      >
                        {historyQuery}
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-100 border-l-4 border-red-500 text-red-700 rounded-lg">
            <p className="font-semibold">Error:</p>
            <p>{error}</p>
          </div>
        )}

        {/* Results Display */}
        {data.length > 0 && (
          <div className="mt-8">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-purple-700">
                Results ({data.length} rows)
              </h3>
              <button
                onClick={() => navigator.clipboard.writeText(JSON.stringify(data, null, 2))}
                className="bg-purple-100 text-purple-700 px-3 py-1 rounded hover:bg-purple-200 transition-colors text-sm"
              >
                Copy JSON
              </button>
            </div>
            <pre className="bg-gray-50 p-4 rounded-lg overflow-auto max-h-96 border border-gray-200 text-xs md:text-sm">
              {JSON.stringify(data, null, 2)}
            </pre>
          </div>
        )}
      </section>

      {/* Visualization Section */}
      <section id="visualization" className="p-6 md:p-10 max-w-6xl mx-auto mb-12 rounded-xl md:rounded-3xl shadow-xl md:shadow-2xl bg-white">
        <h2 className="text-2xl md:text-3xl font-bold mb-6 text-purple-700 tracking-wide">
          Age Distribution
        </h2>
        {data.length > 0 ? (
          <div className="h-64 md:h-96">
            <Bar 
              data={chartData} 
              options={{
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                  legend: {
                    position: 'top',
                  },
                  tooltip: {
                    mode: 'index',
                    intersect: false,
                  }
                },
                scales: {
                  y: {
                    beginAtZero: true,
                    title: {
                      display: true,
                      text: 'Age'
                    }
                  },
                  x: {
                    title: {
                      display: true,
                      text: 'Users'
                    }
                  }
                }
              }}
            />
          </div>
        ) : (
          <div className="h-64 flex items-center justify-center">
            <p className="text-gray-400 italic">No data to display. Run a query first.</p>
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-auto bg-gradient-to-r from-purple-700 via-pink-600 to-red-500 text-white text-center py-4 md:py-5 font-semibold tracking-wide">
        © {new Date().getFullYear()} User Data Explorer — All Rights Reserved
      </footer>
    </div>
  );
}