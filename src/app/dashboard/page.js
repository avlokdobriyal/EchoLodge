"use client";
import { useState, useEffect } from "react";
import { Loader, notify } from "@/components/ui/index.js";

export default function DashboardPage() {
  const [reviews, setReviews] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await fetch("http://localhost:5000/api/reviews");
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        const data = await response.json();
        setReviews(data);
      } catch (error) {
        notify('Error fetching data', 'error');
      } finally {
        setIsLoading(false);
      }
    };

    fetchReviews();
  }, []);

  return (
    <div className="max-w-4xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-extrabold text-slate-900 dark:text-slate-100 mb-8 border-b pb-4 dark:border-slate-800">
        Dashboard Reviews
      </h1>
      
      {isLoading ? (
        <div className="flex justify-center items-center py-20">
          <Loader className="w-8 h-8 text-slate-500" />
          <span className="ml-3 text-slate-500">Loading reviews...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {reviews.length > 0 ? (
            reviews.map((review) => (
              <div key={review.id} className="p-6 bg-white dark:bg-slate-800 rounded-lg shadow-md border border-slate-200 dark:border-slate-700">
                <h3 className="text-xl font-semibold mb-2 dark:text-slate-200">{review.guestName}</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 font-medium">{review.roomType}</p>
                <p className="text-slate-600 dark:text-slate-300 mb-4">{review.reviewText}</p>
                <span className={`inline-block px-3 py-1 text-sm rounded-full font-semibold ${
                  review.sentiment === 'positive' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                  review.sentiment === 'negative' ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400' :
                  'bg-gray-100 text-gray-800 dark:bg-slate-700 dark:text-slate-300'
                }`}>
                  {review.sentiment.charAt(0).toUpperCase() + review.sentiment.slice(1)}
                </span>
              </div>
            ))
          ) : (
            <p className="text-slate-500 dark:text-slate-400">No reviews found.</p>
          )}
        </div>
      )}
    </div>
  );
}
