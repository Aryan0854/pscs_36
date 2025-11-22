// Test the date logic used in the dashboard API
console.log('Current date:', new Date());

const processingTimeChart = Array.from({ length: 7 }, (_, i) => {
  const date = new Date();
  date.setDate(date.getDate() - (6 - i));
  const dayName = date.toLocaleDateString("en", { weekday: "short" });
  
  console.log(`Day ${i}: ${dayName} - ${date.toDateString()}`);
  
  return {
    day: dayName,
    time: 0, // Placeholder
  };
});

console.log('Processing time chart days:', processingTimeChart);