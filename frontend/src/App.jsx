import { useState, useEffect } from 'react'
import {
  Box,
  Container,
  VStack,
  Heading,
  Text,
  Button,
  Input,
  FormControl,
  FormLabel,
  FormHelperText,
  useToast,
  Card,
  CardBody,
  Icon,
  Progress,
  Badge,
  HStack,
  Flex,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  SimpleGrid,
  Skeleton,
  SkeletonText,
} from '@chakra-ui/react'
import { FiFile, FiDownload, FiHeart, FiLink, FiUpload, FiTrendingUp, FiBarChart2, FiActivity } from 'react-icons/fi'
import axios from 'axios'

// API URL - bisa diubah via environment variable saat build
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000'

function App() {
  const [file, setFile] = useState(null)
  const [url, setUrl] = useState('')
  const [sheetName, setSheetName] = useState('Data')
  const [sheetNameUrl, setSheetNameUrl] = useState('Data')
  const [loading, setLoading] = useState(false)
  const [stats, setStats] = useState(null)
  const [statsLoading, setStatsLoading] = useState(true)
  const toast = useToast()

  // Fetch statistics on component mount and after successful conversion
  const fetchStats = async () => {
    try {
      setStatsLoading(true)
      const response = await axios.get(`${API_URL}/stats`)
      setStats(response.data)
      console.log('Stats loaded:', response.data)
    } catch (error) {
      console.error('Failed to fetch stats:', error)
      // Set default stats if API fails
      setStats({
        total_conversions: 0,
        by_type: {
          file_upload: 0,
          url_conversion: 0
        },
        by_format: {
          json: 0,
          csv: 0
        },
        today: {
          total: 0,
          file_upload: 0,
          url_conversion: 0
        },
        last_7_days: []
      })
    } finally {
      setStatsLoading(false)
    }
  }

  useEffect(() => {
    fetchStats()
  }, [])

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0]
    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop().toLowerCase()
      if (!['json', 'csv'].includes(fileExt)) {
        toast({
          title: 'Format file tidak valid',
          description: 'Gunakan file .json atau .csv',
          status: 'error',
          duration: 3000,
          isClosable: true,
        })
        return
      }
      setFile(selectedFile)
    }
  }

  const handleSubmit = async (event) => {
    event.preventDefault()

    if (!file) {
      toast({
        title: 'Pilih file',
        description: 'Silakan pilih file JSON atau CSV terlebih dahulu',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)

    const formData = new FormData()
    formData.append('file', file)
    formData.append('sheet_name', sheetName)

    try {
      const response = await axios.post(`${API_URL}/convert`, formData, {
        responseType: 'blob',
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      })

      // Download file
      const url = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `${file.name.split('.')[0]}_converted.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast({
        title: 'Konversi berhasil!',
        description: 'File Excel telah berhasil diunduh',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Refresh statistics
      fetchStats()

      // Reset form
      setFile(null)
      event.target.reset()
    } catch (error) {
      console.error('Error:', error)
      console.error('Error response:', error.response)

      let errorMessage = 'Terjadi kesalahan saat konversi'

      if (error.response) {
        // Server responded with error
        if (error.response.data instanceof Blob) {
          // Error response is Blob, need to read it
          try {
            const text = await error.response.data.text()
            const errorData = JSON.parse(text)
            errorMessage = errorData.detail || errorMessage
          } catch (e) {
            console.error('Failed to parse error blob:', e)
          }
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail
        }

        errorMessage += ` (Status: ${error.response.status})`
      } else if (error.request) {
        // Request made but no response
        errorMessage = 'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan di http://localhost:8000'
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage
      }

      toast({
        title: 'Konversi gagal',
        description: errorMessage,
        status: 'error',
        duration: 7000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setFile(null)
    setSheetName('Data')
  }

  const handleUrlSubmit = async (event) => {
    event.preventDefault()

    if (!url) {
      toast({
        title: 'Masukkan URL',
        description: 'Silakan masukkan URL file JSON atau CSV terlebih dahulu',
        status: 'warning',
        duration: 3000,
        isClosable: true,
      })
      return
    }

    setLoading(true)

    try {
      const response = await axios.post(
        `${API_URL}/convert-url`,
        {
          url: url,
          sheet_name: sheetNameUrl,
        },
        {
          responseType: 'blob',
          headers: {
            'Content-Type': 'application/json',
          },
        }
      )

      // Download file
      const downloadUrl = window.URL.createObjectURL(new Blob([response.data]))
      const link = document.createElement('a')
      link.href = downloadUrl
      link.setAttribute('download', `url_converted.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()

      toast({
        title: 'Konversi berhasil!',
        description: 'File Excel telah berhasil diunduh',
        status: 'success',
        duration: 5000,
        isClosable: true,
      })

      // Refresh statistics
      fetchStats()

      // Reset form
      setUrl('')
      setSheetNameUrl('Data')
    } catch (error) {
      console.error('Error:', error)
      console.error('Error response:', error.response)

      let errorMessage = 'Terjadi kesalahan saat konversi'

      if (error.response) {
        // Server responded with error
        if (error.response.data instanceof Blob) {
          // Error response is Blob, need to read it
          try {
            const text = await error.response.data.text()
            const errorData = JSON.parse(text)
            errorMessage = errorData.detail || errorMessage
          } catch (e) {
            console.error('Failed to parse error blob:', e)
          }
        } else if (error.response.data?.detail) {
          errorMessage = error.response.data.detail
        }

        errorMessage += ` (Status: ${error.response.status})`
      } else if (error.request) {
        // Request made but no response
        errorMessage =
          'Tidak dapat terhubung ke server. Pastikan backend sedang berjalan di http://localhost:8000'
      } else {
        // Something else happened
        errorMessage = error.message || errorMessage
      }

      toast({
        title: 'Konversi gagal',
        description: errorMessage,
        status: 'error',
        duration: 7000,
        isClosable: true,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleUrlReset = () => {
    setUrl('')
    setSheetNameUrl('Data')
  }

  return (
    <Box minH="100vh" bg="gray.50" py={6}>
      <Container maxW="container.md">
        <VStack spacing={5} align="stretch">
          {/* Header */}
          <VStack spacing={1}>
            <Heading size="lg" color="blue.600">
              Konversi Data ke Excel
            </Heading>
            <Text fontSize="sm" color="gray.600" textAlign="center">
              Konversi file JSON atau CSV ke format Excel (.xlsx) dengan mudah
            </Text>
          </VStack>

          {/* Statistics Cards */}
          <SimpleGrid columns={{ base: 1, md: 3 }} spacing={3}>
            {statsLoading ? (
              // Loading skeletons
              <>
                {[1, 2, 3].map((i) => (
                  <Card size="sm" key={i}>
                    <CardBody py={3}>
                      <Skeleton height="16px" width="120px" mb={2} />
                      <Skeleton height="32px" width="80px" mb={1} />
                      <Skeleton height="12px" width="150px" />
                    </CardBody>
                  </Card>
                ))}
              </>
            ) : stats ? (
              // Actual stats
              <>
                <Card size="sm">
                  <CardBody py={3}>
                    <Stat>
                      <HStack spacing={2} mb={1}>
                        <Icon as={FiBarChart2} color="blue.500" boxSize={4} />
                        <StatLabel fontSize="xs">Total Konversi</StatLabel>
                      </HStack>
                      <StatNumber fontSize="2xl" color="blue.600">
                        {stats.total_conversions.toLocaleString()}
                      </StatNumber>
                      <StatHelpText fontSize="xs" mt={0}>Semua waktu</StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card size="sm">
                  <CardBody py={3}>
                    <Stat>
                      <HStack spacing={2} mb={1}>
                        <Icon as={FiTrendingUp} color="green.500" boxSize={4} />
                        <StatLabel fontSize="xs">Hari Ini</StatLabel>
                      </HStack>
                      <StatNumber fontSize="2xl" color="green.600">
                        {stats.today.total.toLocaleString()}
                      </StatNumber>
                      <StatHelpText fontSize="xs" mt={0}>
                        File: {stats.today.file_upload} | URL: {stats.today.url_conversion}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>

                <Card size="sm">
                  <CardBody py={3}>
                    <Stat>
                      <HStack spacing={2} mb={1}>
                        <Icon as={FiActivity} color="purple.500" boxSize={4} />
                        <StatLabel fontSize="xs">Format Populer</StatLabel>
                      </HStack>
                      <StatNumber fontSize="2xl" color="purple.600">
                        {stats.by_format.json >= stats.by_format.csv ? 'JSON' : 'CSV'}
                      </StatNumber>
                      <StatHelpText fontSize="xs" mt={0}>
                        JSON: {stats.by_format.json} | CSV: {stats.by_format.csv}
                      </StatHelpText>
                    </Stat>
                  </CardBody>
                </Card>
              </>
            ) : null}
          </SimpleGrid>

          {/* Main Card */}
          <Card>
            <CardBody p={4}>
              <Tabs colorScheme="blue" isFitted>
                <TabList mb={4}>
                  <Tab fontSize="sm">
                    <Icon as={FiUpload} mr={2} />
                    Upload File
                  </Tab>
                  <Tab fontSize="sm">
                    <Icon as={FiLink} mr={2} />
                    Dari URL
                  </Tab>
                </TabList>

                <TabPanels>
                  {/* Tab 1: Upload File */}
                  <TabPanel p={0}>
                    <form onSubmit={handleSubmit}>
                      <VStack spacing={4} align="stretch">
                        {/* File Upload */}
                        <FormControl isRequired>
                          <FormLabel fontSize="sm">Upload File</FormLabel>
                          <Input
                            type="file"
                            accept=".json,.csv"
                            onChange={handleFileChange}
                            p={1}
                            disabled={loading}
                            size="sm"
                          />
                          <FormHelperText fontSize="xs">
                            Format: .json dan .csv
                          </FormHelperText>
                        </FormControl>

                        {/* Selected File Info */}
                        {file && (
                          <HStack
                            p={3}
                            bg="blue.50"
                            borderRadius="md"
                            borderWidth={1}
                            borderColor="blue.200"
                          >
                            <Icon as={FiFile} color="blue.500" boxSize={4} />
                            <VStack align="start" spacing={0} flex={1}>
                              <Text fontWeight="medium" fontSize="sm">{file.name}</Text>
                              <Text fontSize="xs" color="gray.600">
                                {(file.size / 1024).toFixed(2)} KB
                              </Text>
                            </VStack>
                            <Badge colorScheme="blue" fontSize="xs">
                              {file.name.split('.').pop().toUpperCase()}
                            </Badge>
                          </HStack>
                        )}

                        {/* Sheet Name */}
                        <FormControl>
                          <FormLabel fontSize="sm">Nama Sheet Excel</FormLabel>
                          <Input
                            value={sheetName}
                            onChange={(e) => setSheetName(e.target.value)}
                            placeholder="Data"
                            disabled={loading}
                            size="sm"
                          />
                          <FormHelperText fontSize="xs">
                            Nama sheet di file Excel
                          </FormHelperText>
                        </FormControl>

                        {/* Progress */}
                        {loading && (
                          <Box>
                            <Text mb={1} fontSize="xs" color="gray.600">
                              Sedang memproses...
                            </Text>
                            <Progress size="sm" isIndeterminate colorScheme="blue" />
                          </Box>
                        )}

                        {/* Buttons */}
                        <HStack spacing={3}>
                          <Button
                            type="submit"
                            colorScheme="blue"
                            leftIcon={<Icon as={FiDownload} />}
                            isLoading={loading}
                            loadingText="Konversi..."
                            flex={1}
                            size="sm"
                          >
                            Konversi ke Excel
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleReset}
                            disabled={loading}
                            size="sm"
                          >
                            Reset
                          </Button>
                        </HStack>
                      </VStack>
                    </form>
                  </TabPanel>

                  {/* Tab 2: Dari URL */}
                  <TabPanel p={0}>
                    <form onSubmit={handleUrlSubmit}>
                      <VStack spacing={4} align="stretch">
                        {/* URL Input */}
                        <FormControl isRequired>
                          <FormLabel fontSize="sm">URL File JSON/CSV</FormLabel>
                          <Input
                            type="url"
                            value={url}
                            onChange={(e) => setUrl(e.target.value)}
                            placeholder="https://example.com/data.json"
                            disabled={loading}
                            size="sm"
                          />
                          <FormHelperText fontSize="xs">
                            URL lengkap file JSON atau CSV
                          </FormHelperText>
                        </FormControl>

                        {/* URL Info */}
                        {url && (
                          <HStack
                            p={3}
                            bg="green.50"
                            borderRadius="md"
                            borderWidth={1}
                            borderColor="green.200"
                          >
                            <Icon as={FiLink} color="green.500" boxSize={4} />
                            <VStack align="start" spacing={0} flex={1}>
                              <Text fontWeight="medium" fontSize="xs" noOfLines={1}>
                                {url}
                              </Text>
                              <Text fontSize="xs" color="gray.600">
                                URL siap diproses
                              </Text>
                            </VStack>
                          </HStack>
                        )}

                        {/* Sheet Name */}
                        <FormControl>
                          <FormLabel fontSize="sm">Nama Sheet Excel</FormLabel>
                          <Input
                            value={sheetNameUrl}
                            onChange={(e) => setSheetNameUrl(e.target.value)}
                            placeholder="Data"
                            disabled={loading}
                            size="sm"
                          />
                          <FormHelperText fontSize="xs">
                            Nama sheet di file Excel
                          </FormHelperText>
                        </FormControl>

                        {/* Progress */}
                        {loading && (
                          <Box>
                            <Text mb={1} fontSize="xs" color="gray.600">
                              Sedang mengunduh dan memproses...
                            </Text>
                            <Progress size="sm" isIndeterminate colorScheme="blue" />
                          </Box>
                        )}

                        {/* Buttons */}
                        <HStack spacing={3}>
                          <Button
                            type="submit"
                            colorScheme="blue"
                            leftIcon={<Icon as={FiDownload} />}
                            isLoading={loading}
                            loadingText="Konversi..."
                            flex={1}
                            size="sm"
                          >
                            Konversi ke Excel
                          </Button>
                          <Button
                            variant="outline"
                            onClick={handleUrlReset}
                            disabled={loading}
                            size="sm"
                          >
                            Reset
                          </Button>
                        </HStack>
                      </VStack>
                    </form>
                  </TabPanel>
                </TabPanels>
              </Tabs>
            </CardBody>
          </Card>

          {/* Info */}
          <Card bg="blue.50" borderColor="blue.200" size="sm">
            <CardBody p={4}>
              <VStack align="start" spacing={2}>
                <Heading size="xs" color="blue.700">
                  Cara Penggunaan:
                </Heading>

                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="blue.600" mb={0.5}>
                    Opsi 1: Upload File
                  </Text>
                  <Text fontSize="xs" color="gray.700">
                    1. Pilih tab "Upload File" → 2. Pilih file JSON/CSV → 3. Atur nama sheet → 4. Klik "Konversi"
                  </Text>
                </Box>

                <Box>
                  <Text fontSize="xs" fontWeight="semibold" color="blue.600" mb={0.5}>
                    Opsi 2: Dari URL
                  </Text>
                  <Text fontSize="xs" color="gray.700">
                    1. Pilih tab "Dari URL" → 2. Masukkan URL file → 3. Atur nama sheet → 4. Klik "Konversi"
                  </Text>
                </Box>

                <Text fontSize="xs" color="gray.600" fontStyle="italic">
                  * File Excel akan otomatis terunduh setelah konversi selesai
                </Text>
              </VStack>
            </CardBody>
          </Card>

          {/* Footer */}
          <Flex
            justifyContent="center"
            alignItems="center"
            py={4}
            borderTop="1px"
            borderColor="gray.200"
          >
            <Text fontSize="xs" color="gray.600" textAlign="center">
              © 2025, Dibuat dengan{' '}
              <Icon as={FiHeart} color="red.500" display="inline" mb="-2px" />
              {' '}oleh{' '}
              <Text
                as="a"
                href="https://thynk.my.id"
                target="_blank"
                rel="noopener noreferrer"
                fontWeight="semibold"
                color="blue.600"
                _hover={{ color: "blue.700", textDecoration: "underline" }}
              >
                ThynK.my.id
              </Text>
            </Text>
          </Flex>
        </VStack>
      </Container>
    </Box>
  )
}

export default App
