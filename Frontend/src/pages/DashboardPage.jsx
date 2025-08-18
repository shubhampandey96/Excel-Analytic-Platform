// excel-analytics-frontend/src/pages/DashboardPage.jsx
import React, { useEffect, useRef, useState } from "react";
import { useNavigate, Link } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';
import * as XLSX from "xlsx";
import { Chart, registerables } from "chart.js";

// Import your services
import fileService from "../services/fileService";
import aiService from "../services/aiService";
import socketService from "../services/socketService";

// Register Chart.js components globally for use
Chart.register(...registerables);

// ProgressModal Component (add this above DashboardPage or in a separate file)
const ProgressModal = ({ show, progress, message, onClose }) => {
    if (!show) return null;

    return (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-75 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm w-full mx-4">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">Processing Data...</h3>
                <div className="w-full bg-gray-200 rounded-full h-2.5 mb-4">
                    <div
                        className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
                        style={{ width: `${progress}%` }}
                    ></div>
                </div>
                <p className="text-sm text-gray-700 text-center mb-4">{message}</p>
                {progress === 100 && (
                    <button
                        onClick={onClose}
                        className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition duration-200"
                    >
                        Close
                    </button>
                )}
            </div>
        </div>
    );
};

const DashboardPage = () => {
    const navigate = useNavigate();
    const [user, setUser] = useState(null);

    const [selectedFile, setSelectedFile] = useState(null);
    const [uploadFeedback, setUploadFeedback] = useState("");
    const [columnHeaders, setColumnHeaders] = useState([]);
    const [excelParsedData, setExcelParsedData] = useState([]);
    const [xAxis, setXAxis] = useState("");
    const [yAxis, setYAxis] = useState("");
    const [chartType, setChartType] = useState("bar");
    const [analysisHistory, setAnalysisHistory] = useState([]);
    const [showDownloadBtn, setShowDownloadBtn] = useState(false);
    const [isChartReady, setIsChartReady] = useState(false);
    const [llmInsights, setLlmInsights] = useState(
        'Click "Get Smart Insights ✨" to receive AI-powered summaries of your data!'
    );

    const [showProgressModal, setShowProgressModal] = useState(false);
    const [progressMessage, setProgressMessage] = useState("");
    const [progressPercentage, setProgressPercentage] = useState(0);

    const chartInstanceRef = useRef(null);
    const chartCanvasRef = useRef(null);
    const fileInputRef = useRef(null);

    // Effect to handle user authentication and Socket.IO connection
    useEffect(() => {
        const token = localStorage.getItem('token');
        // console.log('Token:', jwtDecode(token).username.split(' ')[0]);
        if (token) {
            try {
                const decoded = jwtDecode(token);
                setUser(decoded);
                console.log('User:', user);
                socketService.connect();

                socketService.on('file_processing_progress', (data) => {
                    setProgressPercentage(data.progress);
                    setProgressMessage(data.message);
                    setShowProgressModal(true);
                    if (data.progress === 100) {
                        setTimeout(() => {
                            setShowProgressModal(false);
                            setProgressPercentage(0); // Reset progress after successful file processing
                            if (fileInputRef.current) {
                                fileInputRef.current.value = '';
                            }
                        }, 1500);
                    }
                });

                socketService.on('ai_analysis_progress', (data) => {
                    setProgressPercentage(data.progress);
                    setProgressMessage(data.message);
                    setShowProgressModal(true);
                    if (data.result) {
                        setLlmInsights(data.result);
                    }
                    if (data.progress === 100) {
                        setTimeout(() => {
                            setShowProgressModal(false);
                            setProgressPercentage(0); // Reset progress after successful AI analysis
                        }, 1500);
                    }
                });

                socketService.on('processing_error', (data) => {
                    setProgressMessage(`Error: ${data.message}`);
                    setProgressPercentage(0); // Reset progress on error
                    setShowProgressModal(true);
                    console.error("Processing error from backend:", data);
                    setTimeout(() => {
                        setShowProgressModal(false);
                    }, 3000);
                });

            } catch (error) {
                console.error('Failed to decode token or connect socket:', error);
                localStorage.removeItem('token');
                navigate('/login');
            }
        } else {
            navigate('/login');
        }

        return () => {
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
            }
            socketService.disconnect();
            socketService.off('file_processing_progress');
            socketService.off('ai_analysis_progress');
            socketService.off('processing_error');
        };
    }, [navigate]);

    // This useEffect will now only trigger renderChart when isChartReady is true
    // and other dependencies change.
    useEffect(() => {
        // Only attempt to render if the canvas is ready AND dependencies are met
        if (isChartReady && excelParsedData.length > 0 && xAxis && yAxis && chartCanvasRef.current) {
            renderChart();
        }
    }, [isChartReady, xAxis, yAxis, chartType, excelParsedData]); // Added isChartReady as dependency

    // Handler for local file input change (for immediate preview)
    const handleFileChange = (event) => {
        const file = event.target.files[0];
        setSelectedFile(file);
        setUploadFeedback("");
        setColumnHeaders([]);
        setExcelParsedData([]);
        setXAxis("");
        setYAxis("");
        setShowDownloadBtn(false);
        setIsChartReady(false); // Reset chart readiness

        setLlmInsights('Click "Get Smart Insights ✨" to receive AI-powered summaries of your data!');

        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            chartInstanceRef.current = null;
        }

        if (file) {
            setUploadFeedback(`File ${file.name} selected. Parsing for local preview...`);
            const reader = new FileReader();

            reader.onload = (event) => {
                try {
                    const data = new Uint8Array(event.target.result);
                    const workbook = XLSX.read(data, { type: "array" });
                    const sheetName = workbook.SheetNames[0];
                    const worksheet = workbook.Sheets[sheetName];

                    const json = XLSX.utils.sheet_to_json(worksheet, { header: 1 });

                    if (json.length > 0) {
                        const headers = json[0];
                        const rows = json.slice(1);

                        setColumnHeaders(headers);
                        setExcelParsedData(rows);
                        setUploadFeedback(`File ${file.name} parsed successfully for local preview. Select axes and chart type.`);
                    } else {
                        setUploadFeedback("Excel file is empty or could not be parsed for local preview.");
                        setColumnHeaders([]);
                        setExcelParsedData([]);
                    }
                } catch (error) {
                    console.error("Error parsing Excel file for local preview:", error);
                    setUploadFeedback("Error parsing Excel file for local preview. Please try again.");
                    setColumnHeaders([]);
                    setExcelParsedData([]);
                }
            };
            reader.readAsArrayBuffer(file);
        }
    };

    // Function to render the chart using Chart.js
    const renderChart = () => {
        console.log("renderChart called!");
        console.log("chartCanvasRef.current (inside renderChart):", chartCanvasRef.current);
        console.log("excelParsedData.length:", excelParsedData.length);
        console.log("xAxis:", xAxis);
        console.log("yAxis:", yAxis);

        // Ensure canvas ref is available, and data/axes are selected
        if (!chartCanvasRef.current || !excelParsedData.length || !xAxis || !yAxis) {
            console.log("renderChart: Early return due to missing canvas ref, data, or axes.");
            if (chartInstanceRef.current) {
                chartInstanceRef.current.destroy();
                chartInstanceRef.current = null;
                console.log("renderChart: Destroyed existing chart instance.");
            }
            setIsChartReady(false);
            setShowDownloadBtn(false);
            return;
        }

        // Destroy existing chart instance to prevent memory leaks and conflicts
        if (chartInstanceRef.current) {
            chartInstanceRef.current.destroy();
            console.log("renderChart: Destroyed previous chart instance before creating new one.");
        }

        const xIndex = columnHeaders.indexOf(xAxis);
        const yIndex = columnHeaders.indexOf(yAxis);

        console.log("columnHeaders:", columnHeaders);
        console.log("xIndex:", xIndex, "yIndex:", yIndex);

        if (xIndex === -1 || yIndex === -1) {
            console.warn("renderChart: Selected X or Y axes not found in column headers.");
            setIsChartReady(false);
            setShowDownloadBtn(false);
            return;
        }

        const labels = excelParsedData.map((row) => row[xIndex]);
        const dataPoints = excelParsedData.map((row) => parseFloat(row[yIndex]));

        const validLabels = [];
        const validDataPoints = [];

        for (let i = 0; i < labels.length; i++) {
            if (!isNaN(dataPoints[i])) {
                validLabels.push(labels[i]);
                validDataPoints.push(dataPoints[i]);
            }
        }
        console.log("validDataPoints.length:", validDataPoints.length);

        if (validDataPoints.length === 0) {
            setUploadFeedback("No valid numeric data points found for selected Y-axis column. Chart cannot be generated.");
            setIsChartReady(false);
            setShowDownloadBtn(false);
            console.log("renderChart: No valid data points found.");
            return;
        }

        const ctx = chartCanvasRef.current.getContext("2d");
        chartInstanceRef.current = new Chart(ctx, {
            type: chartType,
            data: {
                labels: validLabels,
                datasets: [{
                    label: `${yAxis || "Value"} vs ${xAxis || "Category"}`,
                    data: validDataPoints,
                    backgroundColor: ["pie", "doughnut", "polarArea"].includes(chartType) ? [
                        "rgba(255, 99, 132, 0.6)", "rgba(54, 162, 235, 0.6)", "rgba(255, 206, 86, 0.6)",
                        "rgba(75, 192, 192, 0.6)", "rgba(153, 102, 255, 0.6)", "rgba(255, 159, 64, 0.6)",
                        "rgba(100, 100, 100, 0.6)", "rgba(200, 50, 200, 0.6)"
                    ] : "rgba(75, 192, 192, 0.6)",
                    borderColor: ["pie", "doughnut", "polarArea"].includes(chartType) ? [
                        "rgba(255, 99, 132, 1)", "rgba(54, 162, 235, 1)", "rgba(255, 206, 86, 1)",
                        "rgba(75, 192, 192, 1)", "rgba(153, 102, 255, 1)", "rgba(255, 159, 64, 1)",
                        "rgba(100, 100, 100, 1)", "rgba(200, 50, 200, 1)"
                    ] : "rgba(75, 192, 192, 1)",
                    borderWidth: 1,
                    fill: chartType === "line",
                    tension: chartType === "line" ? 0.4 : 0,
                }],
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                scales: ["pie", "doughnut", "polarArea", "radar"].includes(chartType) ? {} : {
                    x: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: xAxis,
                            font: { size: 14, weight: "bold" },
                        },
                    },
                    y: {
                        beginAtZero: true,
                        title: {
                            display: true,
                            text: yAxis,
                            font: { size: 14, weight: "bold" },
                        },
                    },
                },
                plugins: {
                    tooltip: {
                        mode: "index",
                        intersect: false,
                        callbacks: {
                            label: function (context) {
                                let label = context.dataset.label || "";
                                if (label) {
                                    label += ": ";
                                }
                                if (context.parsed.y !== null) {
                                    label += new Intl.NumberFormat("en-US", { style: "decimal" }).format(context.parsed.y);
                                }
                                return label;
                            }
                        }
                    },
                    legend: {
                        display: true,
                        position: "top",
                        labels: {
                            font: { size: 12 }
                        }
                    },
                    title: {
                        display: true,
                        text: `Chart of ${yAxis || "Selected Y"} vs ${xAxis || "Selected X"} (${chartType.toUpperCase()})`,
                        font: { size: 16, weight: "bold" }
                    }
                },
                animation: {
                    duration: 1000,
                    easing: "easeInOutQuad",
                },
            },
        });
        setIsChartReady(true);
        setShowDownloadBtn(true);
        console.log("renderChart: Chart successfully created and showDownloadBtn set to true.");
    };

    const handleFileUploadToBackend = async () => {
        if (!selectedFile) {
            alert("Please select a file to upload.");
            return;
        }

        setProgressPercentage(0);
        setProgressMessage("Initiating file upload...");
        setShowProgressModal(true);

        try {
            await fileService.uploadFile(selectedFile);
            setUploadFeedback("File upload initiated. Check progress for status.");
        } catch (error) {
            console.error("Error uploading file:", error);
            setProgressMessage(`Upload failed: ${error.message}`);
            setProgressPercentage(0);
        }
    };

    const handleGenerateChart = () => {
        console.log("handleGenerateChart called!");
        if (!selectedFile) {
            alert("Please upload an Excel file first (local preview).");
            return;
        }
        if (!xAxis || !yAxis) {
            alert("Please select both X and Y axes for the chart.");
            return;
        }

        if (excelParsedData.length === 0) {
            alert("Please parse a file locally first (using 'Choose File') to generate a chart preview.");
            return;
        }

        // Set isChartReady to true here to ensure canvas is rendered
        setIsChartReady(true); // This triggers a re-render

        // Allow React to render the canvas, then render the chart in the next tick
        // by calling renderChart directly.
        // The useEffect will also trigger it, but this ensures it happens immediately
        // after the user clicks the button and the canvas is guaranteed to be in DOM.
        setTimeout(() => {
            renderChart();
        }, 0);


        const newAnalysisEntry = {
            fileName: selectedFile.name,
            chartType: chartType.charAt(0).toUpperCase() + chartType.slice(1),
            date: new Date().toLocaleDateString(),
            xAxis: xAxis,
            yAxis: yAxis,
        };
        setAnalysisHistory(prevHistory => [...prevHistory, newAnalysisEntry]);
        setUploadFeedback(`Chart generated successfully for ${selectedFile.name}.`);
    };

    const handleDownloadChart = () => {
        if (chartInstanceRef.current) {
            const link = document.createElement("a");
            link.href = chartInstanceRef.current.toBase64Image();
            link.download = `excel_chart_${new Date().getTime()}.png`;
            link.click();
        } else {
            alert("No chart generated to download.");
        }
    }

    const handleGenerateInsights = async () => {
        if (!selectedFile) {
            alert("Please upload an Excel file and generate a chart first.");
            return;
        }

        setProgressPercentage(0);
        setProgressMessage("Initiating AI analysis...");
        setShowProgressModal(true);

        try {
            await aiService.getAIInsights();
        } catch (error) {
            console.error("Error requesting AI insights:", error);
            setProgressMessage(`AI analysis failed: ${error.message}`);
            setProgressPercentage(0);
            setLlmInsights(`Failed to get insights: ${error.message}`);
        }
    };

    // Render nothing until user is loaded to prevent flickering or errors
    if (!user) {
        return (
            <div className="flex justify-center items-center h-screen">
                <p className="text-gray-600">Loading user data...</p>
            </div>
        );
    }

    return (
        <div className="container mx-auto p-4 bg-white rounded-xl shadow-2xl my-8 border border-gray-200">
            <div className="flex justify-between items-center mb-8">
                <h1 className="text-3xl sm:text-4xl font-bold text-gray-800">
                    Welcome, {user.username.split(' ')[0] || user.email || 'User'}!
                </h1>
                <button
                    onClick={() => {
                        localStorage.removeItem('token');
                        navigate('/login');
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition duration-300"
                >
                    Logout
                </button>
            </div>

            {/* User Role Display */}
            <div className="mb-8 p-4 bg-blue-50 rounded-md border border-blue-200">
                {!user.isAdmin && (
                    <p className="text-blue-700 text-sm mt-1">
                    As a User, your access is restricted to User Dashboard.
                </p>
                )}
                {user.isAdmin && (
                    <p className="text-blue-700 text-sm mt-1">
                        As an Admin, you have access to additional features like the{' '}
                        <Link to="/admin" className="text-blue-600 hover:underline">Admin Dashboard</Link>.
                    </p>
                )}
            </div>

            {/* Progress Modal */}
            <ProgressModal
                show={showProgressModal}
                progress={progressPercentage}
                message={progressMessage}
                onClose={() => setShowProgressModal(false)}
            />

            {/* Section 1: File Upload & Configuration */}
            <section className="mb-10 p-6 border border-gray-300 rounded-lg bg-gray-50">
                <h3 className="text-center text-xl font-semibold text-gray-800 mb-4">Upload Excel File & Configure</h3>
                <p className="text-gray-700 mb-4 text-center">Select an Excel File (.xls, .xlsx), then choose your axes and desired chart type to begin.</p>

                {/* File Upload Area */}
                <div className="flex flex-col sm:flex-row items-center space-y-4 sm:space-y-0 sm:space-x-4">
                    <input
                        type="file"
                        accept=".xlsx, .xls"
                        onChange={handleFileChange}
                        ref={fileInputRef}
                        className="block w-full text-sm text-gray-900 border border-gray-300 rounded-lg cursor-pointer bg-white focus:outline-none file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                        id="file-upload-input"
                    />
                    <label htmlFor="file-upload-input" className="sr-only">Choose File</label> {/* Accessibility for hidden input */}
                    <span className="text-gray-700 text-sm"> {selectedFile ? selectedFile.name : "No File Selected"}</span>
                </div>

                {uploadFeedback && (
                    <p className="mt-3 text-sm text-gray-600 text-center">{uploadFeedback}</p>
                )}

                {/* New button to upload file to backend */}
                <div className="flex justify-center mt-6">
                    <button
                        type="button"
                        disabled={!selectedFile}
                        className="disabled:bg-indigo-400 disabled:transition-none disabled:translate-y-0 disabled:shadow-none bg-indigo-600 text-white py-2 px-6 rounded-full shadow-md hover:bg-indigo-700 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
                        onClick={handleFileUploadToBackend}
                    >
                        Upload File to Backend
                    </button>
                </div>


                {/* X-Axis and Y-Axis in one row */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                    {/* X-Axis Column Selection */}
                    <div>
                        <label htmlFor="xAxis" className="block text-sm font-medium text-gray-700 mb-1">X-Axis Column</label>
                        <select id="xAxis" value={xAxis} onChange={(e) => setXAxis(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <option value="">Select X-Axis</option>
                            {/* Only show mock options if no real headers are available */}
                            {columnHeaders.length === 0 && (
                                <>
                                    <option value={"Mock X-Axis"}>Mock X-Axis</option>
                                    <option value={"Category"}>Category (Example)</option>
                                </>
                            )}
                            {columnHeaders.map((header, index) => (
                                <option key={index} value={header}>{header}</option>
                            ))}
                        </select>
                    </div>
                    {/* Y-Axis Column Selection */}
                    <div>
                        <label htmlFor="yAxis" className="block text-sm font-medium text-gray-700 mb-1">Y-Axis Column</label>
                        <select id="yAxis" value={yAxis} onChange={(e) => setYAxis(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <option value="">Select Y-Axis</option>
                            {/* Only show mock options if no real headers are available */}
                            {columnHeaders.length === 0 && (
                                <>
                                    <option value={"Mock Y-Axis"}>Mock Y-Axis</option>
                                    <option value={"Value"}>Value (Example)</option>
                                </>
                            )}
                            {columnHeaders.map((header, index) => (
                                <option key={index} value={header}>{header}</option>
                            ))}
                        </select>
                    </div>
                </div>

                {/* Chart Type Selection on another row, now full width */}
                <div className="mt-4">
                    <div>
                        <label htmlFor="chartType" className="block text-sm font-medium text-gray-700 mb-1">Chart Type</label>
                        <select id="chartType" value={chartType} onChange={(e) => setChartType(e.target.value)} className="mt-1 block w-full py-2 px-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm">
                            <option value="bar">Bar Chart</option>
                            <option value="line">Line Chart</option>
                            <option value="pie">Pie Chart</option>
                            <option value="doughnut">Doughnut Chart</option>
                            <option value="polarArea">Polar Area Chart</option>
                            <option value="radar">Radar Chart</option>
                            <option value="scatter">Scatter Chart</option>
                        </select>
                    </div>
                </div>

                {/* Generate Chart Button - Centrally Aligned*/}
                <div className="flex justify-center mt-6 gap-4">
                    <button
                        type="button"
                        disabled={!selectedFile || !xAxis || !yAxis || excelParsedData.length === 0}
                        className="disabled:bg-blue-400 disabled:transition-none disabled:translate-y-0 disabled:shadow-none bg-blue-600 text-white py-2 px-6 rounded-full shadow-md hover:bg-blue-700 transition-all duration-300 transform hover:-translate-y-0.5 hover:shadow-lg"
                        onClick={handleGenerateChart}
                    >
                        Generate Chart
                    </button>
                </div>
            </section>

            {/* Section 2: Chart Display & AI Insights */}
            <section className="mb-10 p-6 border border-gray-300 rounded-lg bg-gray-50 text-center">
                <h3 className="text-center text-xl font-semibold text-gray-800 mb-4">Visualization & Insights</h3>
                <p className="text-gray-700 mb-4">Your generated chart will appear below. After generating a chart, you can also view AI-generated insights.</p>

                {/* Chart Canvas */}
                {/* Always render the div, but conditionally show the canvas inside based on isChartReady */}
                <div className="chart-container-wrapper relative h-96 w-full mt-4">
                    {isChartReady ? (
                        <canvas ref={chartCanvasRef} id="analyticsChart"></canvas>
                    ) : (
                        <div className="flex items-center justify-center h-full text-gray-500">
                            <p>Select a file, axes, and click "Generate Chart" to see a preview.</p>
                        </div>
                    )}
                </div>

                {/* Action Buttons: Download and Get Insights */}
                <div className="flex flex-col sm:flex-row justify-center gap-4 mt-6">
                    {showDownloadBtn && (
                        <button className="bg-purple-600 hover:bg-purple-700 text-white font-semibold py-2 px-6 rounded-full shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg" onClick={handleDownloadChart}>Download Chart (PNG)</button>
                    )}
                    <button
                        className="bg-green-600 hover:bg-green-700 text-white font-semibold py-2 px-6 rounded-full shadow-md transition-all duration-300 transform hover:-translate-y-1 hover:shadow-lg disabled:bg-gray-400"
                        onClick={handleGenerateInsights}
                        disabled={!selectedFile || progressPercentage > 0} // Disable if no file or if another process is running
                    >
                        {progressPercentage > 0 && progressMessage.includes("AI analysis") ? (
                            <i className="bx bx-hourglass bx-spin mr-2" />
                        ) : (
                            "Get Smart Insights ✨"
                        )}
                    </button>
                </div>

                {/* LLM Insights Display Area */}
                <div className="text-left mt-8 p-4 bg-white border rounded-lg shadow-sm border-gray-200">
                    <h4 className="text-xl font-semibold text-gray-800 mb-2">AI-Powered Insights</h4>
                    <p className="text-gray-700 whitespace-pre-wrap">{llmInsights}</p>
                </div>
            </section>

            {/* Section 3: Analysis History */}
            <section className="p-6 border border-gray-300 rounded-lg bg-gray-50">
                <h3 className="text-center text-xl font-semibold text-gray-800 mb-4">Your Analysis History</h3>
                <p className="text-gray-700 mb-4 text-center">Review your past file uploads and generated analyses.</p>
                <div className="rounded-lg border border-gray-200 overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200">
                        <thead>
                            <tr>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">File Name</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Chart Type</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">X-Axis</th>
                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Y-Axis</th>
                            </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-200">
                            {analysisHistory.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 text-center">No analysis history available. Upload a file and generate a chart.</td>
                                </tr>
                            ) : (
                                analysisHistory.map((entry, index) => (
                                    <tr key={index}>
                                        <td className="px-6 py-4 whitespace-nowrap">{entry.fileName}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{entry.chartType}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{entry.date}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{entry.xAxis}</td>
                                        <td className="px-6 py-4 whitespace-nowrap">{entry.yAxis}</td>
                                    </tr>
                                )))}
                        </tbody>
                    </table>
                </div>
            </section>
        </div>
    );
};

export default DashboardPage;
