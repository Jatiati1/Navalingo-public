import React from "react";
import { render, screen } from "@testing-library/react";
import Logo from "@/components/UI/Logo/Logo";

describe("Logo", () => {
  it("renders with default props", () => {
    render(<Logo />);
    expect(screen.getByText("avalingo")).toBeInTheDocument();
  });

  it("renders with white color", () => {
    const { container } = render(<Logo color="white" />);
    const text = container.querySelector("text");
    expect(text).toBeInTheDocument();
  });

  it("renders with default color", () => {
    const { container } = render(<Logo color="default" />);
    const text = container.querySelector("text");
    expect(text).toBeInTheDocument();
  });

  it("renders with large size", () => {
    const { container } = render(<Logo size="large" />);
    expect(container.firstChild).toBeTruthy();
  });

  it("renders with small size", () => {
    const { container } = render(<Logo size="small" />);
    expect(container.firstChild).toBeTruthy();
  });
});
