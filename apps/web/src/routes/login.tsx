import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import SignInForm from "@/features/sign-in";
import SignUpForm from "@/features/sign-up";

const Login = () => {
  const [showSignIn, setShowSignIn] = useState(true);

  return showSignIn ? (
    <SignInForm onSwitchToSignUp={() => setShowSignIn(false)} />
  ) : (
    <SignUpForm onSwitchToSignIn={() => setShowSignIn(true)} />
  );
};

export const Route = createFileRoute("/login")({
  component: Login,
});
