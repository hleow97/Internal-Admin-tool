import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import CategoryList from "@/components/CategoryList";
import type { Category } from "@/lib/types";

const mockCategories: Category[] = [
  { id: "cat-1", name: "Travel", is_active: true, created_at: "2026-01-01T00:00:00Z", updated_at: "2026-01-01T00:00:00Z" },
  { id: "cat-2", name: "Office Supplies", is_active: false, created_at: "2026-01-02T00:00:00Z", updated_at: "2026-01-02T00:00:00Z" },
];

const defaultProps = {
  categories: mockCategories,
  loading: false,
  error: null,
  page: 1,
  totalPages: 2,
  totalCount: 12,
  showInactive: false,
  selectedCategoryId: null,
  onSelectCategory: jest.fn(),
  onSetPage: jest.fn(),
  onSetShowInactive: jest.fn(),
  onAddCategory: jest.fn().mockResolvedValue(undefined),
  onUpdateCategory: jest.fn().mockResolvedValue(undefined),
  onDismissError: jest.fn(),
};

describe("CategoryList", () => {
  beforeEach(() => jest.clearAllMocks());

  it("renders category table with names and status badges", () => {
    render(<CategoryList {...defaultProps} />);
    expect(screen.getByText("Travel")).toBeInTheDocument();
    expect(screen.getByText("Office Supplies")).toBeInTheDocument();
    // "Active"/"Inactive" appear in both dropdown options and status badges
    expect(screen.getAllByText("Active").length).toBeGreaterThanOrEqual(2);
    expect(screen.getAllByText("Inactive").length).toBeGreaterThanOrEqual(2);
  });

  it("shows spinner while loading", () => {
    render(<CategoryList {...defaultProps} loading={true} categories={[]} />);
    expect(screen.getByRole("status")).toBeInTheDocument();
  });

  it("shows empty state when no categories", () => {
    render(<CategoryList {...defaultProps} categories={[]} totalPages={0} />);
    expect(screen.getByText("No categories found")).toBeInTheDocument();
  });

  it("clicking a row selects that category", () => {
    render(<CategoryList {...defaultProps} />);
    fireEvent.click(screen.getByText("Travel"));
    expect(defaultProps.onSelectCategory).toHaveBeenCalledWith("cat-1");
  });

  it("opens add modal and submits new category", async () => {
    render(<CategoryList {...defaultProps} />);
    fireEvent.click(screen.getByText("+ Add"));

    expect(screen.getByRole("heading", { name: "Add Category" })).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Name"), { target: { value: "New Cat" } });
    fireEvent.submit(screen.getByLabelText("Name").closest("form")!);

    await waitFor(() => {
      expect(defaultProps.onAddCategory).toHaveBeenCalledWith({ name: "New Cat" });
    });
  });

  it("opens edit modal and submits update", async () => {
    render(<CategoryList {...defaultProps} />);
    const editButtons = screen.getAllByText("Edit");
    fireEvent.click(editButtons[0]);

    expect(screen.getByText("Edit Category")).toBeInTheDocument();
    expect(screen.getByDisplayValue("Travel")).toBeInTheDocument();

    fireEvent.change(screen.getByDisplayValue("Travel"), { target: { value: "Travel Updated" } });
    fireEvent.click(screen.getByText("Update Category"));

    await waitFor(() => {
      expect(defaultProps.onUpdateCategory).toHaveBeenCalledWith("cat-1", {
        name: "Travel Updated",
        is_active: true,
        updated_at: "2026-01-01T00:00:00Z",
      });
    });
  });

  it("closes modal on cancel", () => {
    render(<CategoryList {...defaultProps} />);
    fireEvent.click(screen.getByText("+ Add"));
    expect(screen.getByLabelText("Name")).toBeInTheDocument();

    fireEvent.click(screen.getByText("Cancel"));
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();
  });

  it("shows error alert when error is present", () => {
    render(<CategoryList {...defaultProps} error="Something went wrong" />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
  });

  it("filter dropdown calls onSetShowInactive", () => {
    render(<CategoryList {...defaultProps} />);
    fireEvent.change(screen.getByDisplayValue("Active"), { target: { value: "inactive" } });
    expect(defaultProps.onSetShowInactive).toHaveBeenCalledWith(true);
  });
});
