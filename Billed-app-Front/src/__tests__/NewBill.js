/**
 * @jest-environment jsdom
 */
//@ts-nocheck
import { screen, waitFor } from "@testing-library/dom"
import userEvent from '@testing-library/user-event'
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import mockStore from "../__mocks__/store.js"
import { localStorageMock } from "../__mocks__/localStorage.js"
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import router from "../app/Router.js"

jest.mock("../app/store", () => mockStore)


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    beforeEach(() => {
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "employee@test"
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.NewBill)
    })

    // Test de l'icone active lors de la création d'une note de frais
    test("Then mail icon in vertical layout should be highlighted", async () => {
      await waitFor(() => screen.getByTestId("icon-mail"))
      const mailIcon = screen.getByTestId('icon-mail')
      const containsClass = mailIcon.classList
      expect(containsClass).toContain("active-icon")
    })

    // Vérification de l'acceptation d'un fichier avec un format correct lors de l'upload dans l'input du justificatif
    test("Then uploading file with JPG/JPEG/PNG extension should work", () => {
      const html = NewBillUI()       
      document.body.innerHTML = html
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      const fileInput = screen.getByTestId("file")
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      fileInput.addEventListener("change", (e) => handleChangeFile(e))
      const file = new File(["tested file"], "test.png", { type: "image/png" })
      userEvent.upload(fileInput, file)

      // Vérification de l'appel de la fonction et que l'objet File passé en paramètre corresponde à celui uploadé dans l'input
      expect(handleChangeFile).toHaveBeenCalled()
      expect(fileInput.files[0]).toStrictEqual(file)
    })

    // Vérification du refus d'un fichier avec un format incorrect lors de l'upload dans l'input du justificatif
    test("Then uploading wrong extension file should return an error", () => {
      const html = NewBillUI()       
      document.body.innerHTML = html
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })
      
      const fileInput = screen.getByTestId("file")
      const handleChangeFile = jest.fn(newBill.handleChangeFile)
      fileInput.addEventListener("change", (e) => handleChangeFile(e)) 
      const file = new File(["tested file"], "test.pdf", { type: "application/pdf" })
      userEvent.upload(fileInput, file)

      // Vérification de l'appel de la fonction et de la réinitialisation de la value de l'input car format incorrect
      expect(handleChangeFile).toHaveBeenCalled()
      expect(fileInput.value).toBe("")
    })

    // Test d'intégration POST du formulaire
    test("Then clicking on the button should submit the bill form", () => {
      const html = NewBillUI()       
      document.body.innerHTML = html

      const onNavigate = (pathname) => {  
        document.body.innerHTML = ROUTES({ pathname })
      }

      // Création d'une nouvelle Bill de test
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      // Mock des datas qui seront entrées dans le formulaire
      const mockedBill = {
        type: "Transports",
        name: "Vol Paris Bangkok",
        date: "2022-08-08",
        amount: 300,
        vat: 80,
        pct: 20,
        commentary: "Comment",
        fileUrl: "../img/test.png",
        fileName: "test.png",
        status: "pending",
      }

      // Entrée des datas mockées dans les champs du form
      screen.getByTestId("expense-type").value = mockedBill.type
      screen.getByTestId("expense-name").value = mockedBill.name
      screen.getByTestId("datepicker").value = mockedBill.date
      screen.getByTestId("amount").value = mockedBill.amount
      screen.getByTestId("vat").value = mockedBill.vat
      screen.getByTestId("pct").value = mockedBill.pct
      screen.getByTestId("commentary").value = mockedBill.commentary
      newBill.fileName = mockedBill.fileName
      newBill.fileUrl = mockedBill.fileUrl
      
      // Création des fonctions de test associées aux fonctions à tester
      newBill.updateBill = jest.fn()
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))

      const form = screen.getByTestId("form-new-bill")
      form.addEventListener("submit", handleSubmit)
      userEvent.click(screen.getByTestId('btn-send-bill'))

      expect(handleSubmit).toHaveBeenCalled()
      expect(newBill.updateBill).toHaveBeenCalled()
    })
  })

  describe("When an error occurs on API", () => {
    // Erreur 500 à l'envoi du formulaire
    test("fetches error from an API and fails with 500 error", async () => {
      jest.spyOn(mockStore, "bills")
      jest.spyOn(console, "error").mockImplementation(() => {})
      
      Object.defineProperty(window, "localStorage", {
        value: localStorageMock,
      })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee',
        email: "employee@test"
      }))
      document.body.innerHTML = `<div id="root"></div>`
      router()
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }

      mockStore.bills.mockImplementationOnce(() => {
        return {
          update: () => {
            return Promise.reject(new Error("Erreur 500"))
          },
        }
      })
      const newBill = new NewBill({ document, onNavigate, store: mockStore, localStorage: window.localStorage })

      // Submit form
      const form = screen.getByTestId("form-new-bill")
      const handleSubmit = jest.fn((e) => newBill.handleSubmit(e))
      form.addEventListener("submit", handleSubmit)
      userEvent.click(screen.getByTestId('btn-send-bill'))
      await new Promise(process.nextTick)
      expect(console.error).toHaveBeenCalled()
    })
  })
})
