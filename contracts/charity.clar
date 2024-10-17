;; Decentralized Autonomous Charity (DAC) Contract
;; Implements governance, proposals, voting, and fund management

;; Constants
(define-constant ERR-NOT-AUTHORIZED (err u1))
(define-constant ERR-INVALID-PROPOSAL (err u2))
(define-constant ERR-PROPOSAL-ACTIVE (err u3))
(define-constant ERR-PROPOSAL-INACTIVE (err u4))
(define-constant ERR-ALREADY-VOTED (err u5))
(define-constant ERR-INSUFFICIENT-BALANCE (err u6))
(define-constant ERR-INVALID-AMOUNT (err u7))
(define-constant ERR-PROPOSAL-NOT-PASSED (err u8))

;; Data Variables
(define-data-var minimum-donation uint u1000000) ;; 1 STX
(define-data-var proposal-count uint u0)
(define-data-var governance-token-uri (string-utf8 256) "")
