import React from "react";
import { useLocation } from "wouter";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle 
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { LaborCard } from "@/components/labor/LaborCard";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";

// This is a standalone component that implements the labor carousel view
// To be integrated into the dashboard file

export function UpcomingLaborSection({ 
  upcomingLaborTasks,
  getContactName,
  getProjectName,
  getAssociatedTask,
  navigate
}) {
  return (
    <Card className="bg-white mb-6">
      <CardHeader className="border-b border-slate-200 p-4">
        <div className="flex justify-between items-center">
          <CardTitle className="font-medium">Current & Upcoming Labor</CardTitle>
          {upcomingLaborTasks?.length > 0 && (
            <div className="text-sm bg-blue-100 text-blue-800 rounded-full px-3 py-1 font-medium">
              {upcomingLaborTasks.length} {upcomingLaborTasks.length === 1 ? 'Entry' : 'Entries'}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        {upcomingLaborTasks?.length === 0 ? (
          <div className="text-center">
            <p className="text-slate-500">No upcoming labor scheduled</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Mobile view: Carousel */}
            <div className="lg:hidden">
              <Carousel className="w-full">
                <CarouselContent className="-ml-4">
                  {upcomingLaborTasks.map((labor) => {
                    return (
                      <CarouselItem key={labor.id} className="pl-4 md:basis-1/2">
                        <div className="flex flex-col h-full p-1">
                          {/* Labor Card */}
                          <div className="flex flex-col h-full">
                            <LaborCard 
                              labor={{
                                ...labor,
                                fullName: labor.fullName || getContactName(labor.contactId),
                                projectName: getProjectName(labor.projectId),
                                taskDescription: labor.taskDescription || `Work for ${getProjectName(labor.projectId)}`,
                              }}
                              onEdit={() => {
                                if (labor.contactId) {
                                  navigate(`/contacts/${labor.contactId}/labor/${labor.id}`);
                                }
                              }}
                            />
                            
                            {/* View Details button */}
                            <div className="mt-auto pt-2">
                              <Button
                                variant="outline"
                                className="w-full flex items-center justify-center text-blue-600 hover:text-blue-700"
                                onClick={() => {
                                  if (labor.contactId) {
                                    navigate(`/contacts/${labor.contactId}/labor/${labor.id}`);
                                  }
                                }}
                              >
                                <ChevronRight className="h-4 w-4 mr-1" /> View Labor Details
                              </Button>
                            </div>
                          </div>
                        </div>
                      </CarouselItem>
                    );
                  })}
                </CarouselContent>
                <div className="flex justify-center mt-4 pb-2">
                  <CarouselPrevious className="static transform-none translate-y-0 mr-2" />
                  <CarouselNext className="static transform-none translate-y-0 ml-2" />
                </div>
              </Carousel>
            </div>
            
            {/* Desktop view: Original layout */}
            <div className="hidden lg:block">
              {/* This is where the original desktop layout would go */}
              {upcomingLaborTasks.map((labor) => (
                <div key={labor.id} className="mb-4">
                  <LaborCard 
                    labor={{
                      ...labor,
                      fullName: labor.fullName || getContactName(labor.contactId),
                      projectName: getProjectName(labor.projectId),
                      taskDescription: labor.taskDescription || `Work for ${getProjectName(labor.projectId)}`,
                    }}
                    onEdit={() => {
                      if (labor.contactId) {
                        navigate(`/contacts/${labor.contactId}/labor/${labor.id}`);
                      }
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}