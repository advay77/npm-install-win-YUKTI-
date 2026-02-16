"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/services/supabaseClient";

export interface DBUser {
  id: number;
  name: string;
  email: string;
  picture: string;
  credits: number;
  remainingcredits: number;
  organization: string;
  created_at: string;
}

interface DBCandidate {
  id: number;
  name: string;
  email: string;
  picture: string;
  current_occupation: string;
  referal_link: string;
  created_at: string;
}

interface UserDataContextType {
  users: DBUser[] | null;
  setUsers: React.Dispatch<React.SetStateAction<DBUser[] | null>>;
  loading: boolean;
  isNewUser: boolean;
  constCreateNewUser: () => Promise<void>;
  //  totalCredits: number;
  remainingCredits: number;
  setRemainingCredits: React.Dispatch<React.SetStateAction<number>>;
}

const UserDataContext = createContext<UserDataContextType | undefined>(
  undefined
);

export function UserDataProvider({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const skipAuth = pathname?.startsWith("/interview"); // candidate flow should not require auth
  const [users, setUsers] = useState<DBUser[] | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [isNewUser, setIsNewUser] = useState<boolean>(false);
  const [remainingCredits, setRemainingCredits] = useState<number>(0);

  useEffect(() => {
    if (skipAuth) {
      setLoading(false);
      return;
    }
    constCreateNewUser();
  }, [skipAuth]);
  const constCreateNewUser = async () => {
    setLoading(true);

    try {
      const { data: authData } =
        await supabase.auth.getUser();
      const authUser = authData?.user;

      if (!authUser) {
        console.log("⚠️ No authenticated user");
        setLoading(false);
        return;
      }

      console.log("✅ Authenticated user:", authUser.email);

      // Detect provider
      const provider = authUser.app_metadata?.provider;
      const isEmailProvider = provider === "email";
      localStorage.setItem("emailProvider", isEmailProvider ? "true" : "false");

      // Detect role
      const role = authUser.user_metadata?.role;
      console.log("👤 User role:", role);

      // ----------------------------------------------------------
      //  CANDIDATE LOGIC 
      // ----------------------------------------------------------
      if (role === "candidate") {
        console.log("🎯 Candidate detected");

        //  Check if candidate already exists
        const { data: existingCandidate, error: candidateFetchError } =
          await supabase
            .from("candidates")
            .select("*")
            .eq("email", authUser.email)
            .maybeSingle();

        if (candidateFetchError) {
          console.error("❌ Error fetching candidate:", candidateFetchError);
          setLoading(false);
          return;
        }

        if (!existingCandidate) {
          console.log("No candidate found → inserting new candidate via server API");
          try {
            const res = await fetch("/api/create-candidate", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                id: authUser.id,
                name: authUser.user_metadata?.name || "",
                email: authUser.email,
                picture: authUser.user_metadata?.picture || "",
                current_occupation: "",
                referal_link: "",
              }),
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data?.error || "Failed to create candidate");
            console.log("Candidate inserted via server:", data);
          } catch (e) {
            console.error("Error inserting candidate via server:", e);
          }
        } else {
          console.log("✔ Candidate already exists");
        }

        setLoading(false);
        return;
      }

      // ----------------------------------------------------------
      //  Normal Users Logic (YOUR ORIGINAL LOGIC)
      // ----------------------------------------------------------

      const { data: usersDB, error: fetchError } = await supabase
        .from("users")
        .select("*")
        .eq("email", authUser.email);

      if (fetchError) {
        console.error("❌ Error fetching user:", fetchError.message);
        setLoading(false);
        return;
      }

      if (!usersDB || usersDB.length === 0) {
        console.log("No user found → inserting new user via server API");
        try {
          const res = await fetch("/api/create-user", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              id: authUser.id,
              name: authUser.user_metadata?.name,
              email: authUser.email,
              picture: authUser.user_metadata?.picture,
              organization: "no organization",
              credits: 4,
              remainingcredits: 4,
            }),
          });
          const data = await res.json();
          if (!res.ok) throw new Error(data?.error || "Failed to create user");
          console.log("✅ New user inserted via server:", data);
          // data is an array, so we need to access the first element
          const userData = Array.isArray(data) ? data : [data];
          setUsers(userData);
          const rem = userData?.[0]?.remainingcredits;
          const cred = userData?.[0]?.credits;
          // If a brand-new user somehow has null/zero remaining credits, reset to full credits
          if ((rem === null || rem === undefined || rem === 0) && cred && cred > 0) {
            setRemainingCredits(cred);
            // Persist the correction
            await supabase
              .from("users")
              .update({ remainingcredits: cred })
              .eq("email", authUser.email);
          } else if (rem !== undefined) {
            setRemainingCredits(rem ?? cred ?? 0);
          }
          setIsNewUser(true);
        } catch (e: unknown) {
          const errorMessage = e instanceof Error ? e.message : String(e);
          console.log("❌ Error inserting new user via server:", errorMessage);
        }
      } else {
        console.log("✅ Existing user found from DB:", usersDB[0]);
        console.log("📊 User fields:", {
          credits: usersDB[0].credits,
          remainingcredits: usersDB[0].remainingcredits,
          name: usersDB[0].name,
          email: usersDB[0].email,
        });
        setUsers(usersDB);
        setIsNewUser(false);
      }

      setLoading(false);
    } catch (err) {
      console.error("❌ Error in constCreateNewUser:", err);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (users?.[0]) {
      const rem = users[0].remainingcredits;
      const cred = users[0].credits;
      if ((rem === null || rem === undefined) && cred !== undefined) {
        setRemainingCredits(cred);
      } else if (rem === 0 && cred > 0 && isNewUser) {
        // For brand-new users, if remainingcredits came back as 0, treat it as a glitch and show full credits
        setRemainingCredits(cred);
      } else {
        setRemainingCredits(rem ?? cred ?? 0);
      }
    }
  }, [users, isNewUser]);

  return (
    <UserDataContext.Provider
      value={{
        users,
        setUsers,
        loading,
        isNewUser,
        constCreateNewUser,
        remainingCredits,
        setRemainingCredits,
      }}
    >
      {children}
    </UserDataContext.Provider>
  );
}

export function useUserData() {
  const context = useContext(UserDataContext);
  if (context === undefined) {
    throw new Error("useUserData must be used within a UserDataProvider");
  }
  return context;
}
