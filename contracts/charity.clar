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

;; Data Maps
(define-map proposals
    uint  ;; proposal ID
    {
        title: (string-utf8 256),
        description: (string-utf8 1024),
        beneficiary: principal,
        amount: uint,
        votes-for: uint,
        votes-against: uint,
        status: (string-utf8 20),
        end-block: uint,
        executed: bool
    })

(define-map donor-tokens
    principal  ;; donor address
    uint)     ;; token balance

(define-map votes
    {proposal-id: uint, voter: principal}
    bool)

(define-map total-donations
    principal  ;; donor address
    uint)     ;; total amount donated

;; Donation Functions
(define-public (donate)
    (let (
        (amount (stx-get-balance tx-sender))
        (current-tokens (default-to u0 (map-get? donor-tokens tx-sender)))
        (current-donations (default-to u0 (map-get? total-donations tx-sender)))
    )
        (asserts! (>= amount (var-get minimum-donation)) ERR-INVALID-AMOUNT)
        (try! (stx-transfer? amount tx-sender (as-contract tx-sender)))
        (map-set donor-tokens
            tx-sender
            (+ current-tokens (/ amount (var-get minimum-donation))))
        (map-set total-donations
            tx-sender
            (+ current-donations amount))
        (ok true)))

;; Proposal Management
(define-public (create-proposal
    (title (string-utf8 256))
    (description (string-utf8 1024))
    (beneficiary principal)
    (amount uint)
    (duration uint))
    (let (
        (proposal-id (+ (var-get proposal-count) u1))
        (current-tokens (default-to u0 (map-get? donor-tokens tx-sender)))
    )
        (asserts! (>= current-tokens u1) ERR-NOT-AUTHORIZED)
        (map-set proposals proposal-id {
            title: title,
            description: description,
            beneficiary: beneficiary,
            amount: amount,
            votes-for: u0,
            votes-against: u0,
            status: "active",
            end-block: (+ block-height duration),
            executed: false
        })
        (var-set proposal-count proposal-id)
        (ok proposal-id)))

;; Voting System
(define-public (vote (proposal-id uint) (vote-for bool))
    (let (
        (proposal (unwrap! (map-get? proposals proposal-id) ERR-INVALID-PROPOSAL))
        (voter-tokens (default-to u0 (map-get? donor-tokens tx-sender)))
    )
        (asserts! (is-eq (get status proposal) "active") ERR-PROPOSAL-INACTIVE)
        (asserts! (< block-height (get end-block proposal)) ERR-PROPOSAL-INACTIVE)
        (asserts! (not (default-to false (map-get? votes {proposal-id: proposal-id, voter: tx-sender}))) ERR-ALREADY-VOTED)
        (asserts! (> voter-tokens u0) ERR-NOT-AUTHORIZED)

        (map-set votes {proposal-id: proposal-id, voter: tx-sender} true)
        (map-set proposals proposal-id
            (merge proposal
                {
                    votes-for: (if vote-for (+ (get votes-for proposal) voter-tokens) (get votes-for proposal)),
                    votes-against: (if vote-for (get votes-against proposal) (+ (get votes-against proposal) voter-tokens))
                }))
        (ok true)))
