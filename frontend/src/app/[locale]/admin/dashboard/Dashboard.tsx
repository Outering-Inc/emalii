'use client'

import Link from 'next/link'
import useSWR from 'swr'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { formatNumber } from '@/src/lib/utils/utils'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  BarElement,
  ArcElement,
} from 'chart.js'

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Filler,
  Legend,
  BarElement,
  ArcElement
)

// SWR fetcher
const fetcher = (url: string) => fetch(url).then((res) => res.json())

export const options = {
  responsive: true,
  plugins: {
    legend: {
      position: 'top',
    },
  },
}

const Dashboard = () => {
  const { data: summary, error } = useSWR('/api/admin/orders/summary', fetcher)

  if (error) return <p className="text-red-500">{error.message}</p>
  if (!summary) return <p>Loading...</p>

  const salesData = {
    labels: summary.salesData.map((x: { _id: string }) => x._id),
    datasets: [
      {
        fill: true,
        label: 'Sales',
        data: summary.salesData.map((x: { totalSales: number }) => x.totalSales),
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
      },
    ],
  }

  const ordersData = {
    labels: summary.salesData.map((x: { _id: string }) => x._id),
    datasets: [
      {
        fill: true,
        label: 'Orders',
        data: summary.salesData.map((x: { totalOrders: number }) => x.totalOrders),
        borderColor: 'rgb(75, 192, 192)',
        backgroundColor: 'rgba(75, 192, 192, 0.5)',
      },
    ],
  }

  const productsData = {
    labels: summary.productsData.map((x: { _id: string }) => x._id),
    datasets: [
      {
        label: 'Category',
        data: summary.productsData.map((x: { totalProducts: number }) => x.totalProducts),
        backgroundColor: [
          'rgba(255, 99, 132, 0.2)',
          'rgba(54, 162, 235, 0.2)',
          'rgba(255, 206, 86, 0.2)',
          'rgba(75, 192, 192, 0.2)',
          'rgba(153, 102, 255, 0.2)',
          'rgba(255, 159, 64, 0.2)',
        ],
        borderColor: [
          'rgba(255, 99, 132, 1)',
          'rgba(54, 162, 235, 1)',
          'rgba(255, 206, 86, 1)',
          'rgba(75, 192, 192, 1)',
          'rgba(153, 102, 255, 1)',
          'rgba(255, 159, 64, 1)',
        ],
      },
    ],
  }

  const usersData = {
    labels: summary.usersData.map((x: { _id: string }) => x._id),
    datasets: [
      {
        label: 'Users',
        borderColor: 'rgb(53, 162, 235)',
        backgroundColor: 'rgba(53, 162, 235, 0.5)',
        data: summary.usersData.map((x: { totalUsers: number }) => x.totalUsers),
      },
    ],
  }

  return (
    <div className="p-4 space-y-6">
      {/* Stats cards using DaisyUI */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
        <div className="stat shadow rounded-lg">
          <div className="stat-title">Sales</div>
          <div className="stat-value text-primary">${formatNumber(summary.ordersPrice)}</div>
          <div className="stat-desc">
            <Link href="/admin/orders" className="link link-primary">View sales</Link>
          </div>
        </div>

        <div className="stat shadow rounded-lg">
          <div className="stat-title">Orders</div>
          <div className="stat-value text-primary">{summary.ordersCount}</div>
          <div className="stat-desc">
            <Link href="/admin/orders" className="link link-primary">View orders</Link>
          </div>
        </div>

        <div className="stat shadow rounded-lg">
          <div className="stat-title">Products</div>
          <div className="stat-value text-primary">{summary.productsCount}</div>
          <div className="stat-desc">
            <Link href="/admin/products" className="link link-primary">View products</Link>
          </div>
        </div>

        <div className="stat shadow rounded-lg">
          <div className="stat-title">Users</div>
          <div className="stat-value text-primary">{summary.usersCount}</div>
          <div className="stat-desc">
            <Link href="/admin/users" className="link link-primary">View users</Link>
          </div>
        </div>
      </div>

      {/* Line charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card shadow rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Sales Report</h2>
          <div className="w-full h-80">
            <Line data={salesData} />
          </div>
        </div>

        <div className="card shadow rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Orders Report</h2>
          <div className="w-full h-80">
            <Line data={ordersData} />
          </div>
        </div>
      </div>

      {/* Doughnut and Bar charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="card shadow rounded-lg p-4 flex flex-col items-center">
          <h2 className="text-xl font-semibold mb-2">Products Report</h2>
          <div className="w-full max-w-xs md:max-w-md h-80">
            <Doughnut data={productsData} />
          </div>
        </div>

        <div className="card shadow rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-2">Users Report</h2>
          <div className="w-full h-80">
            <Bar data={usersData} />
          </div>
        </div>
      </div>
    </div>
  )
}

export default Dashboard
