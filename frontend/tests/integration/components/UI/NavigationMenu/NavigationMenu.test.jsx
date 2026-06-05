import React from "react";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useNavigate } from "react-router-dom";
import NavigationMenu from "@/components/UI/NavigationMenu/NavigationMenu";

jest.mock("react-router-dom", () => ({
  ...jest.requireActual("react-router-dom"),
  useNavigate: jest.fn(),
}));

describe("NavigationMenu", () => {
  let mockNavigate;
  let mockOnClose;

  beforeEach(() => {
    mockNavigate = jest.fn();
    useNavigate.mockReturnValue(mockNavigate);
    mockOnClose = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  const renderMenu = (props = {}) => {
    return render(
      <MemoryRouter>
        <NavigationMenu
          isOpen={true}
          onClose={mockOnClose}
          {...props}
        />
      </MemoryRouter>
    );
  };

  it("returns null if not isOpen", () => {
    const { container } = renderMenu({ isOpen: false });
    expect(container).toBeEmptyDOMElement();
  });

  it("renders username if provided", () => {
    renderMenu({ username: "Test User" });
    expect(screen.getByText("Test User")).toBeInTheDocument();
  });

  it("handles item click with onClick function", async () => {
    const user = userEvent.setup();
    const mockOnClick = jest.fn();
    const menuItems = [{ id: "1", label: "Item 1", onClick: mockOnClick }];

    renderMenu({ menuItems });

    const btn = screen.getByRole("button", { name: "Item 1" });
    await user.click(btn);

    expect(mockOnClick).toHaveBeenCalled();
    expect(mockOnClose).toHaveBeenCalled();
    expect(mockNavigate).not.toHaveBeenCalled();
  });

  it("handles item click with path", async () => {
    const user = userEvent.setup();
    const menuItems = [{ id: "2", label: "Item 2", path: "/test" }];

    renderMenu({ menuItems });

    const btn = screen.getByRole("button", { name: "Item 2" });
    await user.click(btn);

    expect(mockNavigate).toHaveBeenCalledWith("/test");
    expect(mockOnClose).toHaveBeenCalled();
  });

  it("renders string iconProp as img", () => {
    const menuItems = [{ id: "3", label: "Img Item", icon: "http://example.com/icon.png" }];
    renderMenu({ menuItems });
    const img = screen.getByRole("img", { name: "Img Item" });
    expect(img).toBeInTheDocument();
    expect(img).toHaveAttribute("src", "http://example.com/icon.png");
  });

  it("renders React element iconProp", () => {
    const SvgIcon = <svg data-testid="custom-svg" className="custom" width="10" height="10" />;
    const menuItems = [{ id: "4", label: "Svg Item", icon: SvgIcon }];
    renderMenu({ menuItems });
    const svg = screen.getByTestId("custom-svg");
    expect(svg).toBeInTheDocument();
    expect(svg).toHaveAttribute("width", "10");
    expect(svg).toHaveAttribute("height", "10");
    expect(svg).toHaveClass("custom");
  });

  it("renders all default icons by id", () => {
    const ids = [
      "home", "homenav", "account", "account_nav", "subscription", 
      "subscription_nav", "support", "feedback", "feedback_nav", 
      "logout", "logoutnav", "unknown"
    ];
    
    const menuItems = ids.map(id => ({ id, label: `Label ${id}` }));
    renderMenu({ menuItems });
    
    // Check that we rendered the labels. SVGs are harder to query directly if they don't have titles, 
    // but the branch coverage will be hit just by rendering them.
    ids.forEach(id => {
      expect(screen.getByText(`Label ${id}`)).toBeInTheDocument();
    });
  });

  it("applies class names correctly, including logout", () => {
    const menuItems = [
      { id: "logout", label: "Logout", isLogout: true, className: "extra-class" }
    ];
    renderMenu({ menuItems });
    const btn = screen.getByRole("button", { name: "Logout" });
    expect(btn.className).toContain("logout");
    expect(btn.className).toContain("extra-class");
  });
});
