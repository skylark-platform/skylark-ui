// Old create button tests
// describe("create button", () => {
//   test("renders create button", () => {
//     render(<ObjectSearch withCreateButtons setPanelObject={jest.fn()} />);

//     const createButton = screen.getByText("Create");

//     fireEvent.click(createButton);

//     const csvImportButton = screen.getByText("Import (CSV)");
//     expect(csvImportButton).toBeInTheDocument();
//     expect(csvImportButton.closest("a")).toHaveAttribute("href", "import/csv");
//   });

//   test("opens the create object modal", async () => {
//     render(<ObjectSearch withCreateButtons setPanelObject={jest.fn()} />);

//     const createButton = screen.getByText("Create");

//     fireEvent.click(createButton);

//     const createObjectButton = screen.getByText("Create Object");
//     expect(createObjectButton).toBeInTheDocument();

//     fireEvent.click(createObjectButton);

//     await waitFor(() =>
//       expect(screen.getByTestId("create-object-modal")).toBeInTheDocument(),
//     );
//   });
// });
