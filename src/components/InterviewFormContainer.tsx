/* eslint-disable @typescript-eslint/no-explicit-any */
import React from "react";
import { useTheme } from "@/context/ThemeProvider";
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LuArrowUpRight } from "react-icons/lu";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { LuChevronRight } from "react-icons/lu";
const InterViewType = [
  {
    title: "Technical",
    label: LuArrowUpRight,
  },
  {
    title: "Behavioral",
    label: LuArrowUpRight,
  },
  {
    title: "Experience",
    label: LuArrowUpRight,
  },
  {
    title: "Problem Solving",
    label: LuArrowUpRight,
  },
  {
    title: "Leadership",
    label: LuArrowUpRight,
  },
];
interface InterviewFormData {
  jobTitle: string;
  jobDescription: string;
  interviewDuration: string;
  interviewType: string[];
  acceptResume: boolean;
}

interface InterviewFormProps {
  formData: InterviewFormData;
  onHandleInputChange: (
    field: keyof InterviewFormData,
    value: string | boolean
  ) => void;
  onToggleInterviewType: (type: string) => void;
  onSubmit: () => void;
}

const InterviewFormContainer: React.FC<InterviewFormProps> = ({
  formData,
  onHandleInputChange,
  onToggleInterviewType,
  onSubmit,
}) => {
  const { darkTheme } = useTheme();
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <div className={`p-4 rounded-md max-w-[700px] ${darkTheme ? "bg-slate-800" : "bg-white"}`}>
      <Card className={`p-0 rounded-none shadow-none border-none ${darkTheme ? "bg-slate-800 text-white" : "bg-white text-black"}`}>
        <CardHeader />
        <CardContent>
          <Label htmlFor="text" className={`text-lg font-inter ${darkTheme ? "text-slate-200" : "text-black"}`}>
            Job Position
          </Label>
          <Input
            type="text"
            id="text"
            placeholder="eg: Software Engineer"
            className={`mt-2 max-w-[400px] ${darkTheme ? "border-slate-600 bg-slate-700 text-white placeholder:text-slate-400" : "border-gray-200"}`}
            value={formData.jobTitle}
            onChange={(e) => onHandleInputChange("jobTitle", e.target.value)}
          />
        </CardContent>

        <CardContent>
          <Label htmlFor="message" className={`text-lg font-inter mb-2 ${darkTheme ? "text-slate-200" : "text-black"}`}>
            Job Description
          </Label>
          <Textarea
            id="message"
            placeholder="Enter Detailed Job Description."
            className={`${darkTheme ? "border-slate-600 bg-slate-700 text-white placeholder:text-slate-400" : "border-gray-200"}`}
            value={formData.jobDescription}
            onChange={(e) =>
              onHandleInputChange("jobDescription", e.target.value)
            }
          />
          <div className={`text-right text-sm mt-1 ${darkTheme ? "text-slate-400" : "text-muted-foreground"}`}>
            {formData.jobDescription.length}/800
          </div>
        </CardContent>

        <CardContent>
          <Label htmlFor="duration" className={`text-lg font-inter mb-2 ${darkTheme ? "text-slate-200" : "text-black"}`}>
            Interview Duration
          </Label>
          {mounted ? (
            <Select
              value={formData.interviewDuration}
              onValueChange={(value) =>
                onHandleInputChange("interviewDuration", value)
              }
            >
              <SelectTrigger className={`w-[180px] ${darkTheme ? "border-slate-600 bg-slate-700 text-white" : "border-gray-200"}`}>
                <SelectValue placeholder="Select Duration" />
              </SelectTrigger>
              <SelectContent className={darkTheme ? "bg-slate-700 text-white" : ""}>
                <SelectGroup>
                  <SelectLabel className={darkTheme ? "text-slate-300" : ""}>Time in Min:</SelectLabel>
                  {["10", "15", "30", "45"].map((val) => (
                    <SelectItem key={val} value={val} className={darkTheme ? "text-white" : ""}>
                      {val}
                    </SelectItem>
                  ))}
                </SelectGroup>
              </SelectContent>
            </Select>
          ) : (
            <div className={`h-9 w-[180px] rounded-md border ${darkTheme ? "border-slate-600 bg-slate-700" : "border-gray-200"}`} />
          )}
        </CardContent>

        {/* Interview Types */}
        <CardContent>
          <Label className={`text-lg font-inter mb-2 ${darkTheme ? "text-slate-200" : "text-black"}`}>Interview Type</Label>
          <div className="grid grid-cols-3 gap-3">
            {InterViewType.map((type, index) => {
              const isSelected = formData.interviewType.includes(type.title);
              return (
                <div
                  key={index}
                  onClick={() => onToggleInterviewType(type.title)}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full w-fit cursor-pointer transition-all duration-300
                ${isSelected
                      ? darkTheme ? "bg-gradient-to-r from-blue-600 to-blue-700 text-white" : "bg-blue-600 text-white"
                      : darkTheme ? "bg-slate-700 text-slate-300 hover:bg-slate-600" : "bg-blue-100"
                    }
                hover:scale-105 hover:-translate-y-1`}
                >
                  <span>{type.title}</span>
                  <type.label />
                </div>
              );
            })}
          </div>
        </CardContent>

        {/* Resume Checkbox */}
        <CardContent>
          <div className="flex items-start gap-3 mt-5">
            <Checkbox
              id="terms-2"
              checked={formData.acceptResume}
              onCheckedChange={(value) =>
                onHandleInputChange("acceptResume", value)
              }
              className="mt-2"
            />
            <div className="grid">
              <Label htmlFor="terms-2" className={`text-lg font-inter ${darkTheme ? "text-slate-200" : "text-black"}`}>
                Accept Resume
              </Label>
              <p className={`text-sm ${darkTheme ? "text-slate-400" : "text-muted-foreground"}`}>
                By clicking this, Candidates will be able to upload their
                resume.
              </p>
            </div>
          </div>
        </CardContent>

        <CardFooter className="w-full flex items-center justify-center my-6">
          <Button
            onClick={onSubmit}
            className={`mt-5 text-white cursor-pointer ${darkTheme ? "bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800" : "bg-blue-600 hover:bg-blue-700"}`}
          >
            Generate AI Questions
            <LuChevronRight className="inline-flex text-xl text-white" />
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default InterviewFormContainer;
