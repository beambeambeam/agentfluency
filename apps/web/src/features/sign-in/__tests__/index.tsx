// @vitest-environment jsdom

import { cleanup, fireEvent, render, screen } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vite-plus/test";

import SignInForm from "@/features/sign-in";

vi.mock("@tanstack/react-router", () => ({
  useNavigate: () => vi.fn<() => void>(),
}));

vi.mock("@/lib/auth-client", () => ({
  authClient: {
    useSession: () => ({ isPending: false }),
  },
}));

afterEach(cleanup);

test("requests sign-up when the user selects Sign Up", () => {
  const onSwitchToSignUp = vi.fn<() => void>();

  render(<SignInForm onSwitchToSignUp={onSwitchToSignUp} />);
  fireEvent.click(
    screen.getByRole("button", { name: "Need an account? Sign Up" })
  );

  expect(onSwitchToSignUp).toHaveBeenCalledOnce();
});
