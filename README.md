# OpenHeart Chain 💝

A decentralized charitable giving platform built on blockchain technology, enabling transparent campaign creation, multi-token donations, and real-time impact tracking. Revolutionize charitable giving with zero platform fees and complete trust.

---

## 🌟 Features

- **Transparent Campaigns**: Create and manage fundraising campaigns with full blockchain transparency
- **Multi-Token Support**: Accept donations in multiple tokens (USDC, WETH, WBTC) on Sepolia testnet
- **No Platform Fees**: 100% of donations go directly to beneficiaries
- **Real-Time Tracking**: Monitor campaign progress and donation impact instantly
- **Admin Dashboard**: Manage token permissions and platform settings with role-based access control
- **Wallet Integration**: Connect via MetaMask, Coinbase Wallet, Rainbow, or in-app web3 authentication
- **Dark/Light Mode**: Seamless theme switching for user preference
- **Responsive Design**: Works seamlessly on desktop and mobile devices

---

## 🛠 Tech Stack

### Frontend

- **React** 19.2.0 - Modern UI library
- **Vite** 7.2.4 - Fast build tool and dev server
- **Tailwind CSS** 4.1.17 - Utility-first CSS framework
- **Lucide React** 0.555.0 - Icon library

### Web3 & Blockchain

- **Thirdweb** 5.114.1 - Web3 SDK for contract interaction
- **ethers.js** 6.16.0 - Ethereum JavaScript library
- **Wagmi** 2.19.5 - React hooks for Ethereum
- **RainbowKit** - Wallet connection UI

### State & Utilities

- **React Router DOM** 7.9.6 - Client-side routing
- **React Toastify** 11.0.5 - Toast notifications
- **Vanta.js** - Animated background effects

### Development

- **ESLint** 9.39.1 - Code linting
- **dotenv** 17.2.3 - Environment variable management

---

## 📋 Prerequisites

Before you begin, ensure you have installed:

- **Node.js** >= 16.x
- **npm** or **yarn** package manager
- A **Web3 wallet** (MetaMask, Coinbase Wallet, or Rainbow)
- **Sepolia testnet ETH** and test tokens for interactions

---

## 🚀 Getting Started

### 1. Clone the Repository

```bash
git clone https://github.com/peter-mwau/openHeart-chain.git
cd openHeart-chain
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Configure Environment Variables

Create a `.env.local` file in the root directory:

```env
# Thirdweb
VITE_THIRDWEB_CLIENT_ID=your_thirdweb_client_id

# Smart Contracts (Sepolia Testnet)
VITE_DONATE_CONTRACT_ADDRESS=your_donor_contract_address
VITE_USDC_CONTRACT_ADDRESS=your_usdc_token_address
VITE_WETH_CONTRACT_ADDRESS=your_weth_token_address
VITE_WBTC_CONTRACT_ADDRESS=your_wbtc_token_address

# Optional: Token Price API
VITE_COINGECKO_API_URL=https://api.coingecko.com/api/v3

# Wagmi / Wallet Connect
VITE_WALLETCONNECT_PROJECT_ID=your_walletconnect_project_id
```

### 4. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### 5. Build for Production

```bash
npm run build
```

---

## 📖 Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Navbar.jsx
│   ├── CreateCampaign.jsx
│   ├── CampaignCard.jsx
│   ├── CampaignDetails.jsx
│   ├── DonationModal.jsx
│   └── ...
├── pages/               # Page components
│   ├── Home.jsx         # Landing & campaign listings
│   ├── CampaignPage.jsx # Campaign details & management
│   └── ManagePage.jsx   # Admin dashboard
├── contexts/            # React context providers
│   ├── themeContext.jsx # Dark/light mode
│   └── campaignsContext.jsx # Campaign state management
├── hooks/               # Custom React hooks
│   ├── useContract.jsx  # Smart contract interactions
│   └── useTokenConversion.jsx # Token price conversion
├── config/              # Configuration files
│   ├── tokens.js        # Token definitions
│   └── wagmiConfig.js   # Wagmi configuration
├── services/            # External services
│   └── client.js        # Thirdweb client
└── main.jsx             # App entry point
```

---

## 🔗 Smart Contract Deployment

The platform is deployed on **Sepolia Testnet** (Chain ID: 11155111) and uses the following contracts:

- **DonorContract**: Main contract for campaign creation and donations
- **Supported Tokens**: USDC, WETH, WBTC (ERC-20 tokens on Sepolia)

Contract interactions are handled via Thirdweb SDK with support for role-based access control (DEFAULT_ADMIN_ROLE, TOKEN_MANAGER_ROLE).

### Sepolia Testnet Contract Addresses

All contracts are **verified on Etherscan**, allowing anyone to view the source code and deploy to other networks:

| Contract          | Address                                      |
| ----------------- | -------------------------------------------- |
| **DonorContract** | `0x6aF886fB19092E2E122273850eB3036314565478` |
| **USDC Token**    | `0xB8AA56eF0a69ABC809a54d1c0d7fB07014Ce1C8F` |
| **WETH Token**    | `0xa2D8705F1A4d289f1E6133Bf1c012295f9af0228` |
| **WBTC Token**    | `0xf3160dc367b0bB201f0525583f34BaB65A89c552` |

**View on Etherscan**: Search any of the above addresses on [Sepolia Etherscan](https://sepolia.etherscan.io/) to view the full source code and contract details.

### Redeploying to Another Network

Since all contracts are verified and source code is publicly available, you can:

1. Copy the contract code from Etherscan
2. Deploy to your desired EVM-compatible network (Ethereum mainnet, Polygon, Arbitrum, etc.)
3. Update the contract addresses in your `.env.local` file
4. Adjust the chain configuration in `wagmiConfig.js`

---

## 🎯 Usage Guide

### For Donors

1. Connect your Web3 wallet
2. Browse active campaigns
3. Select a campaign and choose your donation token
4. Enter donation amount and confirm in your wallet
5. Track your contribution in real-time

### For Campaign Creators

1. Connect your wallet
2. Click "Create Campaign"
3. Fill in campaign details (name, description, goal, duration)
4. Set the donation token
5. Launch and monitor your campaign

### For Administrators

1. Navigate to "Manage" page (admin only)
2. Manage token permissions
3. Configure allowed donation tokens
4. Monitor platform activity

---

## 🤝 Contributing

We welcome contributions from the community! Here's how to get started:

### 1. Fork the Repository

Click the "Fork" button on GitHub to create your own copy.

### 2. Clone Your Fork

```bash
git clone https://github.com/YOUR_USERNAME/openHeart-chain.git
cd openHeart-chain
```

### 3. Create a Feature Branch

```bash
git checkout -b feature/your-feature-name
```

### 4. Make Your Changes

- Follow the existing code style
- Use Tailwind CSS for styling
- Keep components modular and reusable
- Test your changes thoroughly

### 5. Commit Your Changes

```bash
git add .
git commit -m "feat: add your feature description"
```

### 6. Push to Your Branch

```bash
git push origin feature/your-feature-name
```

### 7. Create a Pull Request

- Go to the original repository on GitHub
- Click "New Pull Request"
- Provide a clear description of your changes
- Reference any related issues

### Guidelines

- Write clear, descriptive commit messages
- Update documentation if needed
- Test on Sepolia testnet before submitting
- Follow React and JavaScript best practices
- Ensure responsive design works on mobile

---

## 📝 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

## 🌐 Network Information

**Supported Network**: Sepolia Testnet (Chain ID: 11155111)

To use the platform:

1. Add Sepolia testnet to your wallet
2. Get test ETH from [Sepolia Faucet](https://www.sepoliafaucet.io)
3. Request test tokens from the respective faucets

---

## 🗺️ What's Next for OpenHeart Chain

We have an exciting roadmap ahead to expand and enhance the platform:

- **Multi-Chain Expansion** - Extend to Ethereum mainnet, Polygon, Arbitrum, and other EVM-compatible chains to reach broader audiences
- **Advanced Analytics Dashboard** - AI-powered insights into campaign effectiveness, donor engagement, and impact metrics
- **Mobile Application** - Native iOS and Android apps for on-the-go donations and campaign management
- **Real-World Identity Verification** - Integration with decentralized identity solutions for enhanced campaign creator accountability
- **Recurring Donations** - Automated recurring donation features for sustained support of long-term causes
- **Charitable Partnerships** - Collaborations with established charitable organizations to bridge traditional and blockchain philanthropy
- **Governance Token** - Implementation of OpenHeart DAO token to decentralize platform decision-making and give community members voting power
- **Cross-Border Optimization** - Enhanced payment systems for global accessibility and reduced transaction friction

Stay tuned for updates on these exciting initiatives!

---

## 🐛 Troubleshooting

### Wallet Connection Issues

- Ensure your wallet is connected to Sepolia testnet
- Clear browser cache and reload
- Try a different wallet provider

### Transaction Errors

- Check you have sufficient gas (ETH) on Sepolia
- Verify token approval before donating
- Ensure contract addresses are correctly configured in `.env.local`

### Contract Interaction Failures

- Verify Thirdweb Client ID is valid
- Check WalletConnect Project ID configuration
- Ensure smart contracts are deployed on Sepolia

---

## 📞 Support

For issues and questions:

- Open an issue on [GitHub Issues](https://github.com/peter-mwau/openHeart-chain/issues)
- Join our community discussions
- Check existing documentation

---

## 🎉 Acknowledgments

Built with ❤️ for transparent and accountable charitable giving.

**Key Technologies**:

- **Thirdweb** for Web3 infrastructure
- **Vanta.js** for beautiful animations
- **Tailwind CSS** for responsive design
- **Ethereum/Sepolia** for blockchain infrastructure
- **React & Vite** for fast development and modern UX

**Special Thanks**:

Thank you to all contributors, testers, and the blockchain community for supporting transparent and accountable charitable giving.

---

**Happy Contributing! 🚀**

Together, we're revolutionizing how people give and make a difference in the world.

## Expanding the ESLint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint rules enabled. Check out the [TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for information on how to integrate TypeScript and [`typescript-eslint`](https://typescript-eslint.io) in your project.
