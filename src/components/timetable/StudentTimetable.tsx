import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Announcements() {
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch announcements
  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/announcements`,
          {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
              // Uncomment if backend requires authentication:
              // "Authorization": `Bearer ${localStorage.getItem("token")}`
            },
          }
        );

        if (!response.ok) {
          throw new Error(
            `Error fetching announcements: ${response.status} ${response.statusText}`
          );
        }

        const data = await response.json();
        setAnnouncements(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load announcements.");
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  if (loading) {
    return <p>Loading announcements...</p>;
  }

  if (error) {
    return <p className="text-red-500">{error}</p>;
  }

  return (
    <div className="p-4 grid gap-4">
      {announcements.map((announcement, index) => (
        <Card key={index} className="shadow-md">
          <CardHeader>
            <CardTitle>{announcement.title}</CardTitle>
            <CardDescription>
              {announcement.authorName} —{" "}
              {new Date(announcement.created_at).toLocaleString()}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p>{announcement.content}</p>
            <Button className="mt-2">Read More</Button>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
