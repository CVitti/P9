/**
 * @jest-environment jsdom
 */

import { screen } from "@testing-library/dom"
import NewBillUI from "../views/NewBillUI.js"
import NewBill from "../containers/NewBill.js"
import Bills from "../containers/Bills.js";
import mockStore from "../__mocks__/store"
import router from "../app/Router.js";
import { ROUTES, ROUTES_PATH } from "../constants/routes"
jest.mock("../app/store", () => mockStore)


describe("Given I am connected as an employee", () => {
  describe("When I am on NewBill Page", () => {
    test("Then bill should be submitted only if file extension is one of : PNG/JPG/JPEG", async () => {
      const html = NewBillUI()
      document.body.innerHTML = html
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
      for (const bill of bills) {
        let newBill = new NewBill({
          document, onNavigate, store : bill, localStorage: null
        })
        newBill.handleChangeFile
      }
    })
  })
})
