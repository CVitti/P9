/**
 * @jest-environment jsdom
 */
//@ts-nocheck
import {screen, waitFor} from "@testing-library/dom"
import BillsUI from "../views/BillsUI.js"
import Bills from "../containers/Bills.js";
import userEvent from '@testing-library/user-event'
import { ROUTES, ROUTES_PATH } from "../constants/routes"
import {localStorageMock} from "../__mocks__/localStorage.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";

jest.mock("../app/store", () => mockStore)

describe("Given I am connected as an employee", () => {
  describe("When I am on Bills Page", () => {

    // Test de surbrillance de l'icône bill lorsqu'on est sur la bonne page
    test("Then bill icon in vertical layout should be highlighted", async () => {
      Object.defineProperty(window, 'localStorage', { value: localStorageMock })
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      await waitFor(() => screen.getByTestId('icon-window'))
      const windowIcon = screen.getByTestId('icon-window')
      const containsClass = windowIcon.classList
      expect(containsClass).toContain("active-icon")
    })

    // Test de tri des dates par ordre décroissant
    test("Then bills should be ordered from earliest to latest", async () => {
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      let billsList = new Bills({
        document, onNavigate, store : mockStore, localStorage: null
      })
      let bills = await billsList.getBills()
      let dates = bills.map(bill => bill.date)
      const antiChrono = (a, b) => ((a < b) ? 1 : -1)
      const datesSorted = [...dates].sort(antiChrono)
      expect(dates).toEqual(datesSorted)
    })

    // Test d'intégration GET
    test("fetches bills from mock API GET", async () => {
      window.localStorage.setItem('user', JSON.stringify({
        type: 'Employee'
      }))
      const root = document.createElement("div")
      root.setAttribute("id", "root")
      document.body.append(root)
      router()
      window.onNavigate(ROUTES_PATH.Bills)
      const onNavigate = (pathname) => {
        document.body.innerHTML = ROUTES({ pathname })
      }
      let billsList = new Bills({
        document, onNavigate, store : mockStore, localStorage: null
      })
      let bills = await billsList.getBills()
      document.body.innerHTML = BillsUI({ data: bills })
      const billsCount  = await screen.getByTestId("tbody").childElementCount
      // Vérification si les 4 bills du mock sont bien récupérées
      expect(billsCount).toEqual(4)
    })

    // Test d'affichage de la modale et de son image
    describe("When I click on the blue eye icon", () => {
      test("Then modal should be displayed with its content", async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        $.fn.modal= jest.fn(function() {
          this[0].classList.add('show')
        })
        const billsList = new Bills({
          document, onNavigate, store : mockStore, localStorage: null
        })
        let bills = await billsList.getBills()
        document.body.innerHTML = BillsUI({ data: bills })

        const firstEye = screen.getAllByTestId("icon-eye").shift()
        let handleClickIconEye1 = jest.fn(() => billsList.handleClickIconEye(firstEye))
        firstEye.addEventListener('click', handleClickIconEye1)
        userEvent.click(firstEye)
        expect(handleClickIconEye1).toHaveBeenCalled()
        expect(screen.getByTestId(`div-modale-file`).classList).toContain("show")
      })
    })

    // Test de navigation vers la page NewBill
    describe("When I click on the new bill button", () => {
      test("Then the redirection function is called", async () => {
        Object.defineProperty(window, 'localStorage', { value: localStorageMock })
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.append(root)
        router()
        window.onNavigate(ROUTES_PATH.Bills)
        const onNavigate = (pathname) => {
          document.body.innerHTML = ROUTES({ pathname })
        }
        const billsList = new Bills({
          document, onNavigate, store : mockStore, localStorage: null
        })
        let bills = await billsList.getBills()
        document.body.innerHTML = BillsUI({ data: bills })

        const newBillBtn = screen.getByTestId("btn-new-bill")
        let handleClickNewBillEvent = jest.fn(() => billsList.handleClickNewBill())
        newBillBtn.addEventListener('click', handleClickNewBillEvent)
        userEvent.click(newBillBtn)
        expect(handleClickNewBillEvent).toHaveBeenCalled()
      })
    })

    // Test de la gestion d'erreur sur la page Bills
    describe("When an error occurs on API", () => {
      beforeEach(() => {
        jest.spyOn(mockStore, "bills")
        Object.defineProperty(
            window,
            'localStorage',
            { value: localStorageMock }
        )
        window.localStorage.setItem('user', JSON.stringify({
          type: 'Employee'
        }))
        const root = document.createElement("div")
        root.setAttribute("id", "root")
        document.body.appendChild(root)
        router()
      })

      // Test Erreur 404
      test("fetches bills from an API and fails with 404 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 404"))
            }
          }})
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 404/)
        expect(message).toBeTruthy()
      })

      // Test Erreur 500
      test("fetches messages from an API and fails with 500 message error", async () => {
        mockStore.bills.mockImplementationOnce(() => {
          return {
            list : () =>  {
              return Promise.reject(new Error("Erreur 500"))
            }
          }})
        window.onNavigate(ROUTES_PATH.Bills)
        await new Promise(process.nextTick);
        const message = await screen.getByText(/Erreur 500/)
        expect(message).toBeTruthy()
      })
    })
  })
})
