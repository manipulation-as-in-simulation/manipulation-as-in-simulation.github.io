// Function to create interactive depth accuracy charts with Chart.js using real data
async function initDepthAccuracyCharts() {
    // Load the real data from JSON file
    try {
        const response = await fetch('data/depth_accuracy_results.json');
        const jsonData = await response.json();
        
        // Process the data and create charts
        createChartsWithRealData(jsonData);
    } catch (error) {
        console.error('Error loading depth accuracy data:', error);
    }
}

function processDepthBinnedData(data, loaderIdx, metric) {
    // Extract data for specific loader and metric
    const rawDepth = data['Raw Depth']?.[loaderIdx]?.[metric] || [];
    const cdmD435 = data['CDM-D435']?.[loaderIdx]?.[metric] || [];
    const cdmL515 = data['CDM-L515']?.[loaderIdx]?.[metric] || [];
    const pixelCounts = data['Raw Depth']?.[loaderIdx]?.['absolute_pixel_counts'] || [];
    
    // Create depth centers (in meters)
    const depthCenters = [];
    const binSize = 0.01;
    for (let i = 0; i < pixelCounts.length; i++) {
        depthCenters.push(0.005 + binSize * i + binSize / 2);
    }
    
    // Normalize metrics by pixel counts and handle log scale
    function normalizeForLog(values, counts) {
        const normalized = [];
        const centers = [];
        const showMarker = []; // Track which points should show markers
        
        // Marker interval - show marker every N valid points (matching Python script)
        const markerInterval = 20;
        let validPointCount = 0;
        
        // Process all points (no sampling) for the line
        for (let i = 0; i < values.length; i++) {
            if (i < counts.length && counts[i] > 0) {
                const depth = depthCenters[i];
                // Only include data points within our display range
                if (depth >= 0.1 && depth <= 2.5) {
                    const normalizedVal = values[i] / counts[i];
                    // Skip invalid values for log scale
                    if (normalizedVal > 0 && !isNaN(normalizedVal) && isFinite(normalizedVal)) {
                        normalized.push(normalizedVal);
                        centers.push(depth);
                        // Show marker at intervals, and always at first and last points
                        showMarker.push(validPointCount % markerInterval === 0);
                        validPointCount++;
                    }
                }
            }
        }
        
        // Ensure first and last points have markers
        if (showMarker.length > 0) {
            showMarker[0] = true;
            showMarker[showMarker.length - 1] = true;
        }
        
        return { values: normalized, centers: centers, showMarker: showMarker };
    }
    
    const rawNormalized = normalizeForLog(rawDepth, pixelCounts);
    const cdmD435Normalized = normalizeForLog(cdmD435, pixelCounts);
    const cdmL515Normalized = normalizeForLog(cdmL515, pixelCounts);
    
    // Debug: Log sample data for first dataset
    if (loaderIdx === '0' && metric === 'absolute_abs_rel') {
        console.log('Sample data for D435 Absolute Relative Error:');
        console.log('Raw depth centers:', rawNormalized.centers.slice(0, 5));
        console.log('Raw depth values:', rawNormalized.values.slice(0, 5));
    }
    
    return {
        raw: rawNormalized,
        cdmD435: cdmD435Normalized,
        cdmL515: cdmL515Normalized
    };
}

function createChartsWithRealData(jsonData) {
    // Common chart options for consistent styling
    const commonOptions = {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
            mode: 'index',
            intersect: false
        },
        plugins: {
            legend: {
                display: true,
                position: 'top',
                labels: {
                    font: {
                        family: 'ByteSans, Roboto, sans-serif',
                        size: 12
                    },
                    padding: 15,
                    usePointStyle: true,
                    boxWidth: 10,
                    boxHeight: 10
                }
            },
            tooltip: {
                enabled: true,
                backgroundColor: 'rgba(22, 33, 62, 0.9)',
                titleFont: {
                    family: 'ByteSans, Roboto, sans-serif',
                    size: 13
                },
                bodyFont: {
                    family: 'ByteSans, Roboto, sans-serif',
                    size: 12
                },
                padding: 10,
                cornerRadius: 4,
                callbacks: {
                    label: function(context) {
                        let label = context.dataset.label || '';
                        if (label) {
                            label += ': ';
                        }
                        if (context.parsed.y !== null) {
                            // Show raw decimal values with appropriate precision
                            const value = context.parsed.y;
                            if (value < 0.001) {
                                label += value.toFixed(6);
                            } else if (value < 0.01) {
                                label += value.toFixed(5);
                            } else if (value < 0.1) {
                                label += value.toFixed(4);
                            } else if (value < 1) {
                                label += value.toFixed(3);
                            } else {
                                label += value.toFixed(2);
                            }
                        }
                        return label;
                    },
                    title: function(context) {
                        if (context[0]) {
                            return 'Depth: ' + context[0].parsed.x.toFixed(2) + 'm';
                        }
                        return '';
                    }
                }
            }
        },
        scales: {
            x: {
                type: 'linear',
                title: {
                    display: true,
                    text: 'Depth Range (m)',
                    font: {
                        family: 'ByteSans, Roboto, sans-serif',
                        size: 13,
                        weight: 'normal'
                    },
                    color: '#555'
                },
                grid: {
                    color: 'rgba(229, 229, 229, 0.3)',
                    lineWidth: 1
                },
                ticks: {
                    font: {
                        size: 11
                    },
                    color: '#666'
                },
                min: 0.1,
                max: 2.5
            },
            y: {
                type: 'logarithmic',
                grid: {
                    color: 'rgba(229, 229, 229, 0.3)',
                    lineWidth: 1
                },
                ticks: {
                    font: {
                        size: 11
                    },
                    color: '#666',
                    callback: function(value) {
                        // Format log scale ticks
                        const tickValues = [0.003, 0.005, 0.007, 0.01, 0.02, 0.03, 0.05, 0.07, 0.1, 0.2, 0.3, 0.5, 0.7, 1, 2];
                        if (tickValues.includes(value)) {
                            if (value >= 0.01) {
                                return value.toFixed(2);
                            }
                            return value.toFixed(3);
                        }
                        return null;
                    }
                }
            }
        }
    };

    const data = jsonData.data;
    
    // Process data for all dataloaders and metrics
    const d435AbsRelData = processDepthBinnedData(data, '0', 'absolute_abs_rel');
    const l515AbsRelData = processDepthBinnedData(data, '1', 'absolute_abs_rel');
    const heliosAbsRelData = processDepthBinnedData(data, '2', 'absolute_abs_rel');
    
    const d435L1Data = processDepthBinnedData(data, '0', 'absolute_l1');
    const l515L1Data = processDepthBinnedData(data, '1', 'absolute_l1');
    const heliosL1Data = processDepthBinnedData(data, '2', 'absolute_l1');
    
    // Chart colors matching the Python script
    const colors = {
        raw: '#ff6d6d',
        cdmD435: '#22c2ac',
        cdmL515: '#3c8cff'
    };
    
    // Helper function to create dataset configuration
    function createDataset(label, data, color, markerArray, pointStyle = 'circle') {
        return {
            label: label,
            data: data.centers.map((x, i) => ({x: x, y: data.values[i]})),
            borderColor: color,
            backgroundColor: 'transparent',
            borderWidth: 2,
            pointStyle: pointStyle,
            pointRadius: markerArray.map(show => show ? 4 : 0),
            pointHoverRadius: 5,
            pointBackgroundColor: color,
            showLine: true,
            tension: 0.1
        };
    }
    
    // Create D435 Dataset - Absolute Relative Error Chart
    new Chart(document.getElementById('d435-absrel-chart'), {
        type: 'scatter',
        data: {
            datasets: [
                createDataset('Raw Depth', d435AbsRelData.raw, colors.raw, d435AbsRelData.raw.showMarker, 'rectRot'),
                createDataset('CDM-D435', d435AbsRelData.cdmD435, colors.cdmD435, d435AbsRelData.cdmD435.showMarker),
                createDataset('CDM-L515', d435AbsRelData.cdmL515, colors.cdmL515, d435AbsRelData.cdmL515.showMarker)
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Value (Log Scale)',
                        font: {
                            family: 'ByteSans, Roboto, sans-serif',
                            size: 13,
                            weight: 'normal'
                        },
                        color: '#555'
                    },
                    min: 0.005,
                    max: 2
                }
            }
        }
    });
    
    // Create D435 Dataset - L1 Error Chart
    new Chart(document.getElementById('d435-l1-chart'), {
        type: 'scatter',
        data: {
            datasets: [
                createDataset('Raw Depth', d435L1Data.raw, colors.raw, d435L1Data.raw.showMarker, 'rectRot'),
                createDataset('CDM-D435', d435L1Data.cdmD435, colors.cdmD435, d435L1Data.cdmD435.showMarker),
                createDataset('CDM-L515', d435L1Data.cdmL515, colors.cdmL515, d435L1Data.cdmL515.showMarker)
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Value (Log Scale)',
                        font: {
                            family: 'ByteSans, Roboto, sans-serif',
                            size: 13,
                            weight: 'normal'
                        },
                        color: '#555'
                    },
                    min: 0.003,
                    max: 2
                }
            }
        }
    });
    
    // Create L515 Dataset - Absolute Relative Error Chart
    new Chart(document.getElementById('l515-absrel-chart'), {
        type: 'scatter',
        data: {
            datasets: [
                createDataset('Raw Depth', l515AbsRelData.raw, colors.raw, l515AbsRelData.raw.showMarker, 'rectRot'),
                createDataset('CDM-D435', l515AbsRelData.cdmD435, colors.cdmD435, l515AbsRelData.cdmD435.showMarker),
                createDataset('CDM-L515', l515AbsRelData.cdmL515, colors.cdmL515, l515AbsRelData.cdmL515.showMarker)
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Value (Log Scale)',
                        font: {
                            family: 'ByteSans, Roboto, sans-serif',
                            size: 13,
                            weight: 'normal'
                        },
                        color: '#555'
                    },
                    min: 0.005,
                    max: 2
                }
            }
        }
    });
    
    // Create L515 Dataset - L1 Error Chart
    new Chart(document.getElementById('l515-l1-chart'), {
        type: 'scatter',
        data: {
            datasets: [
                createDataset('Raw Depth', l515L1Data.raw, colors.raw, l515L1Data.raw.showMarker, 'rectRot'),
                createDataset('CDM-D435', l515L1Data.cdmD435, colors.cdmD435, l515L1Data.cdmD435.showMarker),
                createDataset('CDM-L515', l515L1Data.cdmL515, colors.cdmL515, l515L1Data.cdmL515.showMarker)
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Value (Log Scale)',
                        font: {
                            family: 'ByteSans, Roboto, sans-serif',
                            size: 13,
                            weight: 'normal'
                        },
                        color: '#555'
                    },
                    min: 0.003,
                    max: 2
                }
            }
        }
    });
    
    // Create Helios Dataset - Absolute Relative Error Chart
    new Chart(document.getElementById('helios-absrel-chart'), {
        type: 'scatter',
        data: {
            datasets: [
                createDataset('Raw Depth', heliosAbsRelData.raw, colors.raw, heliosAbsRelData.raw.showMarker, 'rectRot'),
                createDataset('CDM-D435', heliosAbsRelData.cdmD435, colors.cdmD435, heliosAbsRelData.cdmD435.showMarker),
                createDataset('CDM-L515', heliosAbsRelData.cdmL515, colors.cdmL515, heliosAbsRelData.cdmL515.showMarker)
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Value (Log Scale)',
                        font: {
                            family: 'ByteSans, Roboto, sans-serif',
                            size: 13,
                            weight: 'normal'
                        },
                        color: '#555'
                    },
                    min: 0.005,
                    max: 2
                }
            }
        }
    });
    
    // Create Helios Dataset - L1 Error Chart
    new Chart(document.getElementById('helios-l1-chart'), {
        type: 'scatter',
        data: {
            datasets: [
                createDataset('Raw Depth', heliosL1Data.raw, colors.raw, heliosL1Data.raw.showMarker, 'rectRot'),
                createDataset('CDM-D435', heliosL1Data.cdmD435, colors.cdmD435, heliosL1Data.cdmD435.showMarker),
                createDataset('CDM-L515', heliosL1Data.cdmL515, colors.cdmL515, heliosL1Data.cdmL515.showMarker)
            ]
        },
        options: {
            ...commonOptions,
            scales: {
                ...commonOptions.scales,
                y: {
                    ...commonOptions.scales.y,
                    title: {
                        display: true,
                        text: 'Value (Log Scale)',
                        font: {
                            family: 'ByteSans, Roboto, sans-serif',
                            size: 13,
                            weight: 'normal'
                        },
                        color: '#555'
                    },
                    min: 0.003,
                    max: 2
                }
            }
        }
    });
}